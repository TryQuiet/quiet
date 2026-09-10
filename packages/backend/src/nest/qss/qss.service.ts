import type { AdmissionAuthContext } from '../admission/admission-auth-context.types'
/**
 * Abstraction layer for interacting with QSS
 */
import { Mutex } from 'async-mutex'
import { AdmissionKind, AdmissionError, PreparedQssAdmission } from '../admission/admission.types'
import { Server } from '../../../../../3rd-party/auth/packages/auth/dist'
import { MemberContext } from '../../../../../3rd-party/auth/packages/auth/dist/connection'
import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common'
import { SigChain } from '../auth/sigchain'
import { createLogger } from '../common/logger'
import { QSS_ALLOWED, QSS_ENDPOINT } from '../const'
import { QSSClient } from './qss.client'
import * as uint8arrays from 'uint8arrays'
import {
  CommunityOperationStatus,
  CommunitySignInMessage,
  CreateCommunity,
  CreateCommunityResponse,
  CreateCommunityStatus,
  GeneratePublicKeysMessage,
  QSSAuthAttemptFailurePayload,
  QSSAuthErrorPayload,
  WebsocketEvents,
  QSSOperationResult,
  QSSEvents,
  QSSInitStatus,
} from './qss.types'
import { DateTime } from 'luxon'
import * as url from 'node:url'
import EventEmitter from 'node:events'

import { JoinStatus } from '../libp2p/libp2p.auth'
import { QSSAuthConnectionManager } from './qss-auth-conn-manager.service'
import { SigChainService } from '../auth/sigchain.service'
import { RoleName } from '../auth/services/roles/roles'
import { LocalDbService } from '../local-db/local-db.service'
import {
  QSS_DEVICE_ADMISSION_MAX_ATTEMPTS,
  QSS_DEVICE_ADMISSION_RETRY_INITIAL_MS,
  QSS_DEVICE_ADMISSION_RETRY_MAX_MS,
  QSS_RECONNECT_BACKOFF_FACTOR,
  QSS_RECONNECT_DELAY_MS,
  QSS_RECONNECT_MAX_DELAY_MS,
} from './qss.const'
import {
  CompoundError,
  isDeviceInvitationData,
  InvitationDataVersion,
  NseQssUrlUpdatedEvent,
  SocketActions,
  SocketEvents,
  type InvitationDataV5,
} from '@quiet/types'
import { LocalDbEvents } from '../local-db/local-db.types'
import { SocketService } from '../socket/socket.service'
import { QSSSyncManager } from './qss-sync-manager.service'

@Injectable()
export class QSSService extends EventEmitter implements OnModuleDestroy {
  private _paused = false
  private _captchaVerificationQueued = false

  /**
   * Timer for retrying/reconnecting to QSS
   */
  private _reconnectQueueProcessor: NodeJS.Timeout | undefined
  private _reconnectDelayMs = QSS_RECONNECT_DELAY_MS
  private _enabledOverride = false

  /**
   * Mutexes for createCommunity per teamId
   */
  private _signInMutex: Mutex = new Mutex()
  private _connectMutex: Mutex = new Mutex()
  private readonly preparedAdmissions = new Map<
    string,
    {
      prepared: PreparedQssAdmission
      sigChain: SigChain
      context?: AdmissionAuthContext
    }
  >()
  private readonly deviceAdmissionRetries = new Map<
    string,
    { attempts: number; timer?: NodeJS.Timeout; lastFailure: QSSAuthAttemptFailurePayload }
  >()
  private deviceAdmissionRetryGeneration = 0
  private _eventHandlersConfigured = false

  private readonly logger = createLogger(`qss:service`)

  /** Creates the QSS service and registers its connection and admission event handlers. */
  constructor(
    @Inject(QSS_ALLOWED) private _qssAllowed: boolean,
    @Inject(QSS_ENDPOINT) public _qssEndpoint: string,
    private readonly qssClient: QSSClient,
    private readonly qssAuthConnManager: QSSAuthConnectionManager,
    private readonly qssSyncManager: QSSSyncManager,
    private readonly sigChainService: SigChainService,
    private readonly localDbService: LocalDbService,
    private readonly socketService: SocketService
  ) {
    super({ captureRejections: true })
    this._configureEventHandlers()
  }

  /** Closes QSS connections and clears pending work during Nest module teardown. */
  public onModuleDestroy() {
    this.close()
  }

  /** Requests queued captcha verification once the QSS websocket connects. */
  private _requestCaptchaVerificationAfterConnect = (): void => {
    this._captchaVerificationQueued = false
    this.qssClient.requestCaptchaVerification().catch(error => {
      this.logger.error('Failed to request captcha verification', error)
    })
  }

  /** Clears device-admission retries and schedules reconnection after QSS disconnects. */
  private _handleQssDisconnected = (): void => {
    this.logger.debug('QSS disconnected, scheduling reconnect if enabled')
    this.clearDeviceAdmissionRetries()
    this._scheduleReconnect(QSSOperationResult.ERROR)
  }

  /** Completes QSS join handling and forwards asynchronous failures as auth errors. */
  private _handleQssAuthJoined = (teamId: string): void => {
    void this.handleQssAuthJoined(teamId).catch(error => {
      this._handleQssAuthError({
        teamId,
        error: error instanceof Error ? error : new Error(String(error)),
      })
    })
  }

  /**
   * Completes a prepared device admission, then emits that the QSS auth
   * connection joined.
   */
  private async handleQssAuthJoined(teamId: string): Promise<void> {
    this.logger.debug('Auth connection joined via QSS')
    this.clearDeviceAdmissionRetry(teamId)
    const prepared = this.preparedAdmissions.get(teamId)
    if (prepared != null) {
      if (!prepared.context?.gate.published) return
      const context = prepared.context
      await context.gate.run(async () => {
        this.preparedAdmissions.delete(teamId)
        const chain = this.sigChainService.getChain(teamId)
        await this.syncNativePushPrerequisites(teamId, chain, 'admission committed')
        context.gate.assertCurrent()
        this.qssSyncManager.resume()
        this.qssAuthConnManager.markMemberRoleReady(teamId)
        this.qssSyncManager.markMemberRoleReady(teamId)
        this.qssSyncManager.startLogSyncForSignedInTeam(teamId, chain)
        this.emit(QSSEvents.QSS_FULLY_JOINED, teamId)
        this.emit(QSSEvents.QSS_AUTH_JOINED, teamId)
      })
      return
    }
    this.emit(QSSEvents.QSS_AUTH_JOINED, teamId)
  }

  /** Rejects prepared admission and emits a QSS authentication error. */
  private _handleQssAuthError = (payload: QSSAuthErrorPayload): void => {
    this.logger.warn('QSS auth connection failed', payload.teamId, payload.error)
    this.rejectPreparedAdmission(
      payload.teamId,
      payload.error instanceof Error ? payload.error : new Error(String(payload.error))
    )
    this.emit(QSSEvents.QSS_AUTH_ERROR, payload)
  }

  /** Starts retry-or-fail processing for an unsuccessful QSS authentication attempt. */
  private _handleQssAuthAttemptFailed = (payload: QSSAuthAttemptFailurePayload): void => {
    const admission = this.preparedAdmissions.get(payload.teamId)
    if (admission?.context != null) {
      const kind =
        payload.source === 'client-validation'
          ? 'validation'
          : ['TIMEOUT', 'DISCONNECTED', 'ClientAuthSyncError'].includes(payload.code)
            ? 'transport'
            : 'protocol'
      admission.context.fail(new AdmissionError(kind, payload.code))
      return
    }
    void this.processQssAuthAttemptFailure(payload)
  }

  /** Starts an auth connection requested through the service event bus. */
  private _handleStartAuthConnection = (teamId: string): void => {
    void this.startAuthConnection(teamId)
  }

  /** Connects to QSS when necessary and requests hCaptcha verification. */
  private _handleHcaptchaRequest = (): void => {
    this.logger.debug('hCaptcha request received')
    if (!this.connected) {
      if (!this._captchaVerificationQueued) {
        this._captchaVerificationQueued = true
        this.qssClient.once(QSSEvents.QSS_CONNECTED, this._requestCaptchaVerificationAfterConnect)
      }

      this.connect(this.qssEndpoint, true).catch(error => {
        this.logger.error('Failed to connect to QSS on hCaptcha request', error)
      })
    } else {
      this.qssClient.requestCaptchaVerification().catch(error => {
        this.logger.error('Failed to request captcha verification', error)
      })
    }
  }

  /** Requests captcha verification when QSS reports that it is required. */
  private _handleCaptchaRequired = (): void => {
    this.logger.debug('Captcha required event received from QSS')
    this.qssClient.requestCaptchaVerification().catch(error => {
      this.logger.error('Failed to request captcha verification', error)
    })
  }

  /** Requests QSS sign-in processing after the current community is persisted. */
  private _handleCommunityAdded = (): void => {
    this.logger.debug('Community stored, attempting to authenticate with QSS')
    this.emit(QSSEvents.QSS_HANDLE_SIGN_IN)
  }

  /** Requests the appropriate authentication operation after QSS connects. */
  private _handleQssConnected = async (): Promise<void> => {
    this.logger.debug('QSS connected, handling appropriate authentication operation')
    this.emit(QSSEvents.QSS_HANDLE_SIGN_IN)
  }

  /**
   * Creates or signs in the current community after checking local QSS state
   * and the active sigchain.
   */
  private _handleQssHandleSignIn = async (): Promise<void> => {
    await this._signInMutex.runExclusive(async () => {
      const initStatus = await this.getQssInitStatus()
      if (!initStatus.communityInitialized || initStatus.community == null) {
        this.logger.warn('Community is null, skipping qss operation reprocessing until community is stored')
        return
      }

      if (!initStatus.qssEnabled) {
        this.logger.trace('QSS not enabled for this community, skipping sign in')
        return
      }

      let sigChain: SigChain
      try {
        sigChain = this.sigChainService.activeChain
      } catch (e) {
        this.logger.error('No active sigchain present, cannot perform QSS operations')
        return
      }

      if (
        !(initStatus.qssSetup ?? false) &&
        sigChain.team != null &&
        this.sigChainService.users.getAllUsers().length === 1
      ) {
        await this.createCommunity(sigChain)
      } else {
        const teamId =
          sigChain.team != null
            ? sigChain.teamId
            : (initStatus.community?.inviteData as InvitationDataV5).authData.teamId
        this.logger.trace('QSS Sign in', teamId)
        if (teamId == null) {
          this.logger.warn('Attempted to sign into QSS but no team ID was found')
          return
        }
        if (sigChain.team == null) {
          this.logger.debug('Pending invitation admission is coordinated externally; skipping automatic QSS sign-in')
          return
        }
        await this.signInToCommunity(teamId, sigChain)
      }
    })
  }

  /**
   * Self-assigns the member role after QSS admission and marks authentication
   * and log synchronization as ready.
   */
  private _handleSelfAssignMember = async (teamId: string): Promise<void> => {
    try {
      this.logger.debug(`Confirming ${RoleName.MEMBER} role on team ${teamId} after joining with QSS`)
      const sigchain = this.sigChainService.getChain(teamId)

      // Current auth handshakes claim the invitation grant before JOINED. This fallback repairs a
      // restored pre-migration chain locally from its saved invite; the seed never crosses QSS.
      if (!sigchain.roles.amIMemberOfRole(RoleName.MEMBER)) {
        const initStatus = await this.getQssInitStatus()
        const inviteData = initStatus.community?.inviteData
        if (
          inviteData?.version !== InvitationDataVersion.v5 ||
          isDeviceInvitationData(inviteData) ||
          inviteData.authData.teamId !== teamId
        ) {
          throw new Error(`Joined team ${teamId} without a usable invitation ${RoleName.MEMBER} grant`)
        }
        sigchain.roles.addSelf(RoleName.MEMBER, inviteData.authData.seed, inviteData.authData.salt)
      }

      if (!sigchain.roles.amIMemberOfRole(RoleName.MEMBER)) {
        throw new Error(`Joined team ${teamId} without the ${RoleName.MEMBER} role`)
      }
      this.logger.trace(
        `Does the user have the invitation-granted member role?`,
        sigchain.roles.memberHasRole(sigchain.userId, RoleName.MEMBER)
      )

      await this.sigChainService.saveChain(teamId)

      // The sign-in that preceded this ran against an invitee chain with no team, so the
      // native push prerequisites could not be emitted then. Now the chain is complete.
      await this.syncNativePushPrerequisites(teamId, sigchain, 'QSS join completed')

      this.qssAuthConnManager.markMemberRoleReady(teamId)
      this.qssSyncManager.markMemberRoleReady(teamId)
      this.emit(QSSEvents.QSS_FULLY_JOINED, teamId)
    } catch (error) {
      this.logger.error(`Failed to finish QSS member-role admission`, teamId, error)
      this.qssAuthConnManager.stopConnection(teamId, false)
      this.emit(QSSEvents.QSS_AUTH_ERROR, { teamId, error })
    }
  }

  /** Rejects and removes a prepared admission for a team, if one exists. */
  private rejectPreparedAdmission(teamId: string, error: Error): void {
    const state = this.preparedAdmissions.get(teamId)
    if (state == null) {
      return
    }
    this.preparedAdmissions.delete(teamId)
    state.context?.fail(error)
  }

  /** Rejects and removes every prepared admission with the supplied error. */
  private abortPreparedAdmissions(error: Error): void {
    for (const state of this.preparedAdmissions.values()) {
      state.context?.fail(error)
    }
    this.preparedAdmissions.clear()
  }

  /** Registers service event handlers once. */
  private _configureEventHandlers(): void {
    if (this._eventHandlersConfigured) {
      return
    }

    this.qssAuthConnManager.on(QSSEvents.QSS_AUTH_JOINED, this._handleQssAuthJoined)
    this.qssAuthConnManager.on(QSSEvents.QSS_AUTH_ATTEMPT_FAILED, this._handleQssAuthAttemptFailed)
    this.on(QSSEvents.QSS_START_AUTH_CONN, this._handleStartAuthConnection)
    this.socketService.on(SocketActions.HCAPTCHA_REQUEST, this._handleHcaptchaRequest)
    this.qssClient.on(QSSEvents.QSS_CAPTCHA_REQUIRED, this._handleCaptchaRequired)
    this.localDbService.on(LocalDbEvents.COMMUNITY_ADDED, this._handleCommunityAdded)
    this.qssClient.on(QSSEvents.QSS_CONNECTED, this._handleQssConnected)
    this.qssClient.on(QSSEvents.QSS_DISCONNECTED, this._handleQssDisconnected)
    this.on(QSSEvents.QSS_HANDLE_SIGN_IN, this._handleQssHandleSignIn)
    this.qssAuthConnManager.on(QSSEvents.QSS_SELF_ASSIGN_MEMBER, this._handleSelfAssignMember)
    this._eventHandlersConfigured = true
  }

  /** Removes all registered service event handlers once. */
  private _teardownEventHandlers(): void {
    if (!this._eventHandlersConfigured) {
      return
    }

    this.qssAuthConnManager.off(QSSEvents.QSS_AUTH_JOINED, this._handleQssAuthJoined)
    this.qssAuthConnManager.off(QSSEvents.QSS_AUTH_ATTEMPT_FAILED, this._handleQssAuthAttemptFailed)
    this.off(QSSEvents.QSS_START_AUTH_CONN, this._handleStartAuthConnection)
    this.socketService.off(SocketActions.HCAPTCHA_REQUEST, this._handleHcaptchaRequest)
    this.qssClient.off(QSSEvents.QSS_CAPTCHA_REQUIRED, this._handleCaptchaRequired)
    this.localDbService.off(LocalDbEvents.COMMUNITY_ADDED, this._handleCommunityAdded)
    this.qssClient.off(QSSEvents.QSS_CONNECTED, this._handleQssConnected)
    this.qssClient.off(QSSEvents.QSS_DISCONNECTED, this._handleQssDisconnected)
    this.off(QSSEvents.QSS_HANDLE_SIGN_IN, this._handleQssHandleSignIn)
    this.qssAuthConnManager.off(QSSEvents.QSS_SELF_ASSIGN_MEMBER, this._handleSelfAssignMember)
    this._eventHandlersConfigured = false
  }

  /** Starts a team auth connection, returning whether startup succeeded. */
  private async startAuthConnection(teamId: string): Promise<boolean> {
    try {
      await this.qssAuthConnManager.startNewConnection(teamId)
      return true
    } catch (e) {
      this.logger.error('Failed to start QSS auth connection', e)
      return false
    }
  }

  /** Cancels and removes the pending device-admission retry for a team. */
  private clearDeviceAdmissionRetry(teamId: string): void {
    this.deviceAdmissionRetryGeneration += 1
    const retry = this.deviceAdmissionRetries.get(teamId)
    if (retry?.timer != null) {
      clearTimeout(retry.timer)
    }
    this.deviceAdmissionRetries.delete(teamId)
  }

  /** Cancels and removes all pending device-admission retries. */
  private clearDeviceAdmissionRetries(): void {
    this.deviceAdmissionRetryGeneration += 1
    for (const retry of this.deviceAdmissionRetries.values()) {
      if (retry.timer != null) {
        clearTimeout(retry.timer)
      }
    }
    this.deviceAdmissionRetries.clear()
  }

  /** Reports whether an authentication failure can retry device admission. */
  private isRetryableDeviceAdmissionFailure(code: string): boolean {
    return [
      'INVITATION_PROOF_INVALID',
      'ADMIT_MEMBER_LINK_MISSING',
      'DEVICE_UNKNOWN',
      'TIMEOUT',
      'SIGN_IN_FAILED',
    ].includes(code)
  }

  /**
   * Retries eligible device-admission failures with bounded exponential
   * backoff, or emits a terminal authentication error.
   */
  private async processQssAuthAttemptFailure(payload: QSSAuthAttemptFailurePayload): Promise<void> {
    if (this._paused) return
    const retryGeneration = this.deviceAdmissionRetryGeneration
    const initStatus = await this.getQssInitStatus()
    if (this._paused || retryGeneration !== this.deviceAdmissionRetryGeneration) return

    const isDeviceLink =
      initStatus.community?.inviteData != null && isDeviceInvitationData(initStatus.community.inviteData)
    const previousRetry = this.deviceAdmissionRetries.get(payload.teamId)
    const attempts = (previousRetry?.attempts ?? 0) + 1
    if (
      !isDeviceLink ||
      !payload.deviceAdmission ||
      !this.isRetryableDeviceAdmissionFailure(payload.code) ||
      attempts >= QSS_DEVICE_ADMISSION_MAX_ATTEMPTS
    ) {
      this.clearDeviceAdmissionRetry(payload.teamId)
      this._handleQssAuthError({ teamId: payload.teamId, error: payload.error, attempts })
      return
    }

    if (previousRetry?.timer != null) {
      return
    }
    const delayMs = Math.min(
      QSS_DEVICE_ADMISSION_RETRY_INITIAL_MS * 2 ** (attempts - 1),
      QSS_DEVICE_ADMISSION_RETRY_MAX_MS
    )
    const retryState = {
      attempts,
      lastFailure: payload,
      timer: undefined as NodeJS.Timeout | undefined,
    }
    retryState.timer = setTimeout(() => {
      retryState.timer = undefined
      void this.retryDeviceAdmission(payload.teamId)
    }, delayMs)
    this.deviceAdmissionRetries.set(payload.teamId, retryState)
    this.logger.warn(
      `QSS device admission attempt ${attempts} failed; retrying in ${delayMs}ms`,
      payload.teamId,
      payload.error
    )
  }

  /** Restarts QSS authentication for a pending device-admission retry. */
  private async retryDeviceAdmission(teamId: string): Promise<void> {
    const retryState = this.deviceAdmissionRetries.get(teamId)
    if (retryState == null || this._paused || !this.connected) {
      this.clearDeviceAdmissionRetry(teamId)
      return
    }
    const retryGeneration = this.deviceAdmissionRetryGeneration
    const retryIsCurrent = (): boolean =>
      !this._paused &&
      this.connected &&
      retryGeneration === this.deviceAdmissionRetryGeneration &&
      this.deviceAdmissionRetries.get(teamId) === retryState

    if (this.joinStatus(teamId) === JoinStatus.JOINED) {
      this.clearDeviceAdmissionRetry(teamId)
      return
    }

    try {
      if (this.qssAuthConnManager.getConnection(teamId) != null) {
        this.qssAuthConnManager.stopConnection(teamId, true)
      }
      const sigChain = this.sigChainService.getChain(teamId)
      const result = await this.signInToCommunity(teamId, sigChain)
      if (!retryIsCurrent() || result === QSSOperationResult.SUCCESS) return
      await this.processQssAuthAttemptFailure({
        teamId,
        code: 'SIGN_IN_FAILED',
        error: new Error(`Failed to restart QSS authentication for team ${teamId}`),
        source: 'sign-in',
        deviceAdmission: sigChain.isPendingDeviceAdmission,
      })
    } catch (error) {
      if (!retryIsCurrent()) return
      const sigChain = this.sigChainService.getChain(teamId)
      await this.processQssAuthAttemptFailure({
        teamId,
        code: 'SIGN_IN_FAILED',
        error: error instanceof Error ? error : new Error('Failed to restart QSS authentication'),
        source: 'sign-in',
        deviceAdmission: sigChain.isPendingDeviceAdmission,
      })
    }
  }

  /**
   * Check if QSS is allowed and our websocket connection is active
   */
  public get connected(): boolean {
    return this.canConnect && this.qssClient.connected
  }

  /**
   * Check if QSS is allowed to connect and we have a valid endpoint string
   */
  public get canConnect(): boolean {
    return this.qssAllowed && this._qssEndpoint !== '' && this._qssEndpoint != null
  }

  /**
   * Is QSS allowed to connect on this app?
   */
  public get qssAllowed(): boolean {
    return this._qssAllowed
  }

  /**
   * Configured endpoint for QSS on this app (can come from the flag QSS_ENDPOINT or from the invite)
   */
  public get qssEndpoint(): string | undefined {
    return this._qssEndpoint
  }

  /**
   * Check if QSS is enabled for the current community by its sigchain team ID
   *
   * @returns True if QSS is enabled for the current community
   */
  public async getQssInitStatus(): Promise<QSSInitStatus> {
    const community = await this.localDbService.getCurrentCommunity()
    const status: QSSInitStatus = {
      communityInitialized: false,
      qssEnabled: false,
      qssSetup: false,
      community,
    }
    if (community == null) {
      return status
    }

    return {
      ...status,
      qssEnabled: (community as any).qssEnabled ?? false,
      qssSetup: (community as any).qssSetup ?? false,
      communityInitialized: true,
    }
  }

  /**
   * Check the sigchain join status for a given team
   *
   * @param teamId Team ID we want to check LFA chain join status for
   * @returns JoinStatus for this team
   */
  public joinStatus(teamId: string): JoinStatus {
    const authConnection = this.qssAuthConnManager.getConnection(teamId)
    return authConnection?.joinStatus ?? JoinStatus.NOT_STARTED
  }

  /**
   * Connects to a QSS endpoint under a mutex and schedules reconnection when
   * the attempt fails.
   *
   * @param qssEndpoint Endpoint to use, or the currently configured endpoint.
   * @param enabledOverride Whether to connect without requiring community QSS metadata.
   */
  public async connect(qssEndpoint: string | undefined, enabledOverride: boolean = false): Promise<QSSOperationResult> {
    if (this._paused) {
      // Startup may supply the endpoint after a lifecycle pause. Retain it for resume.
      if (qssEndpoint != null) this._qssEndpoint = qssEndpoint
      this._enabledOverride = enabledOverride
      this.logger.debug('Skipping QSS connect because service is paused')
      return QSSOperationResult.DISABLED
    }

    return await this._connectMutex.runExclusive(async () => {
      if (this._paused) {
        if (qssEndpoint != null) this._qssEndpoint = qssEndpoint
        this._enabledOverride = enabledOverride
        this.logger.debug('Skipping QSS connect because service is paused')
        return QSSOperationResult.DISABLED
      }

      this._enabledOverride = enabledOverride

      let connStatus: QSSOperationResult
      try {
        connStatus = await this._connectImpl(qssEndpoint, enabledOverride)
      } catch (e) {
        this.logger.error('Error while connecting to QSS', e)
        connStatus = QSSOperationResult.ERROR
      }

      this._scheduleReconnect(connStatus)

      return connStatus
    })
  }

  /** Cancels a scheduled reconnect and optionally resets its backoff delay. */
  private _clearReconnectTimer(resetDelay = false): void {
    if (this._reconnectQueueProcessor != null) {
      clearTimeout(this._reconnectQueueProcessor)
      this._reconnectQueueProcessor = undefined
    }

    if (resetDelay) {
      this._reconnectDelayMs = QSS_RECONNECT_DELAY_MS
    }
  }

  /** Schedules a reconnect with exponential backoff after a failed operation. */
  private _scheduleReconnect(connStatus: QSSOperationResult): void {
    if (connStatus === QSSOperationResult.SUCCESS) {
      this._clearReconnectTimer(true)
      return
    }

    if (connStatus === QSSOperationResult.DISABLED) {
      this.logger.debug('Not scheduling QSS reconnect because QSS is disabled')
      this._clearReconnectTimer(true)
      return
    }

    if (this._paused || this._reconnectQueueProcessor != null) {
      return
    }

    const reconnectDelayMs = this._reconnectDelayMs
    this._reconnectDelayMs = Math.min(reconnectDelayMs * QSS_RECONNECT_BACKOFF_FACTOR, QSS_RECONNECT_MAX_DELAY_MS)

    this.logger.debug('Scheduling QSS reconnect in', reconnectDelayMs, 'ms')
    this._reconnectQueueProcessor = setTimeout(() => {
      this._reconnectQueueProcessor = undefined
      void this.connect(this.qssEndpoint, this._enabledOverride)
    }, reconnectDelayMs)
  }

  /**
   * Suspends QSS activity, closes active connections, and rejects prepared
   * admissions without disabling QSS configuration.
   */
  public pause(): void {
    this.logger.info('Pausing QSS service')
    this._paused = true
    this._teardownEventHandlers()
    this.qssSyncManager.pause()
    this._clearReconnectTimer(true)
    this.clearDeviceAdmissionRetries()
    this.abortPreparedAdmissions(new Error('QSS admission aborted while service paused'))
    this._captchaVerificationQueued = false
    this.qssAuthConnManager.close()
    this.qssClient.close()
  }

  /** Restores event handling and reconnects QSS after the service was paused. */
  public async resume(): Promise<void> {
    this.logger.info(`Resuming QSS service`)
    this._paused = false
    this._configureEventHandlers()
    this.qssSyncManager.resume()
    if (this.canConnect) await this.connect(this.qssEndpoint, this._enabledOverride)
  }

  /**
   * Connect the QSS client if enabled
   *
   * @param qssEndpoint Determined by the QSS_ENDPOINT env variable and data stored in community metadata and V3 invites
   * @returns True if connection was successful
   */
  private async _connectImpl(qssEndpoint: string | undefined, enabledOverride: boolean): Promise<QSSOperationResult> {
    const requestedEndpoint = qssEndpoint ?? this._qssEndpoint
    const endpointChanged = qssEndpoint != null && qssEndpoint !== this._qssEndpoint
    this._qssEndpoint = requestedEndpoint
    this.qssSyncManager.setQssAllowed(this.qssAllowed)
    this.qssSyncManager.setQssEndpoint(this._qssEndpoint)
    this._enabledOverride = enabledOverride

    // if we are already connected return true and move on
    if (this.connected && !endpointChanged) {
      return QSSOperationResult.SUCCESS
    }

    if (!this.canConnect) {
      this.logger.trace(`Can't connect to QSS because QSS is not initialized`)
      return QSSOperationResult.DISABLED
    }

    if (!enabledOverride) {
      const initStatus = await this.getQssInitStatus()
      if (!initStatus.communityInitialized) {
        this.logger.warn(`Can't determine if QSS is enabled because the community hasn't been initialized in local DB`)
        return QSSOperationResult.ERROR
      }

      if (!initStatus.qssEnabled) {
        this.logger.warn(`Can't connect to QSS because QSS is disabled on this community`)
        return QSSOperationResult.DISABLED
      }
    }

    // A lifecycle pause can arrive while loading community settings above.
    if (this._paused) return QSSOperationResult.DISABLED

    // wait for our socket to finish connecting
    let connStatus: QSSOperationResult
    try {
      this.logger.info(`Establishing connection with QSS`)
      await this.qssClient.createSocketAndConnect(this._qssEndpoint)
      if (this._paused) {
        this.qssClient.close()
        return QSSOperationResult.DISABLED
      }
      this.logger.info(`Connection established`)
      connStatus = QSSOperationResult.SUCCESS
    } catch (e) {
      this.logger.info(`Error while connecting to QSS`, e.message)
      connStatus = QSSOperationResult.ERROR
    }

    return connStatus
  }

  /** Converts a QSS websocket endpoint to the HTTP endpoint expected by NSE. */
  private getNseQssUrl(wsUrl: string | undefined): string | undefined {
    if (wsUrl == null || wsUrl === '') {
      this.logger.warn('Skipping NSE QSS URL update because wsUrl is empty')
      return undefined
    }

    if (wsUrl.startsWith('wss://')) {
      return `https://${wsUrl.slice('wss://'.length)}`
    }

    if (wsUrl.startsWith('ws://')) {
      return `http://${wsUrl.slice('ws://'.length)}`
    }

    this.logger.warn('Skipping NSE QSS URL update because endpoint is not ws/wss', wsUrl)
    return undefined
  }

  private async emitNseQssUrl(wsUrl: string | undefined, sigChain: SigChain): Promise<void> {
    const platform = process.platform as string
    if (platform !== 'ios' && platform !== 'android') {
      this.logger.debug('Skipping NSE QSS URL emit because platform is not iOS or Android', platform)
      return
    }
    try {
      if (sigChain.team == null) {
        this.logger.warn('Skipping NSE QSS URL update because the sigchain has no team yet')
        return
      }
      const community = await this.localDbService.getCurrentCommunity()
      const teamId = community?.teamId ?? sigChain.team.id
      if (teamId == null) {
        this.logger.warn('Skipping NSE QSS URL update because no active community or team ID found')
        this.logger.warn('Community', community)
        return
      }

      const qssUrl = this.getNseQssUrl(wsUrl)
      if (qssUrl == null) {
        this.logger.warn('Skipping NSE QSS URL update because no valid QSS URL could be derived')
        return
      }

      const qssHost = url.parse(qssUrl).hostname
      const normalizedQssHost =
        qssHost != null &&
        /^(127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|localhost)$/.test(
          qssHost
        ) &&
        process.env.NODE_ENV !== 'production'
          ? 'localhost'
          : qssHost
      const qssServerId = normalizedQssHost == null ? undefined : sigChain.server.getServer(normalizedQssHost)?.serverId
      if (qssServerId == null) {
        this.logger.warn('Clearing the NSE QSS configuration because the QSS LFA server identity is not pinned', qssUrl)
        this.socketService.serverIoProvider.io.emit(SocketEvents.NSE_QSS_URL_UPDATED, {
          teamId,
          qssUrl: '',
          qssServerId: '',
        } satisfies NseQssUrlUpdatedEvent)
        return
      }

      const payload: NseQssUrlUpdatedEvent = {
        teamId,
        qssUrl,
        qssServerId,
      }

      this.socketService.serverIoProvider.io.emit(SocketEvents.NSE_QSS_URL_UPDATED, payload)
    } catch (e) {
      this.logger.error('Failed to emit NSE QSS URL update', e)
    }
  }

  /**
   * Add a community to QSS and start syncing our chain with QSS
   *
   * @param sigChain Sigchain for this community
   * @returns True if successfully created
   */
  public async createCommunity(sigChain: SigChain): Promise<boolean> {
    let created: boolean = false
    try {
      return await this._createCommunityImpl(sigChain)
    } catch (e) {
      created = false
      this.logger.error('Failed to create community on QSS', e)
    }

    return created
  }

  /**
   * Add a community to QSS and start syncing our chain with QSS
   *
   * @param sigChain Sigchain for this community
   * @returns True if successfully created
   */
  public async _createCommunityImpl(sigChain: SigChain): Promise<boolean> {
    if (!this.canConnect) {
      this.logger.trace(`Can't create community on QSS because QSS is not initialized`)
      return false
    }

    if (sigChain.team == null) {
      throw new Error(`Team on this sigchain is nullish!`)
    }

    if (!this.connected) {
      this.logger.warn(`Can't create community on QSS because the client hasn't connected`)
      return false
    }

    if (!this.qssClient.captchaVerified) {
      const verified = await this.qssClient.requestCaptchaVerification()
      if (!verified) {
        this.logger.warn(`Can't create community on QSS because captcha verification failed`)
        return false
      }
    }

    // Normalize local-ish hostnames (loopback, LAN IPs) to 'localhost' so the
    // client matches the QSS server's default QSS_HOSTNAME in the sigchain.
    let host = url.parse(this._qssEndpoint).hostname!
    const normalizeLocalHostname =
      process.env.NODE_ENV !== 'production' || process.env.IS_LOCAL === 'true' || process.env.IS_E2E === 'true'
    if (
      /^(127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|localhost)$/.test(
        host
      ) &&
      normalizeLocalHostname
    ) {
      host = 'localhost'
    }

    // if we don't already have this server in our chain we need to generate keys and add it
    if (sigChain.server.getServer(host) == null) {
      // Generating the QSS LFA keyset for this community
      this.logger.info(`Getting server keys for this team`)
      const qssGeneratePublicKeysMessage: GeneratePublicKeysMessage = {
        ts: DateTime.utc().toMillis(),
        status: CommunityOperationStatus.SENDING,
        payload: {
          teamId: sigChain.team.id,
        },
      }
      const generateKeysResponse = await this.qssClient.sendMessage<GeneratePublicKeysMessage>(
        WebsocketEvents.GEN_PUB_KEYS,
        qssGeneratePublicKeysMessage,
        true
      )

      // if we couldn't create QSS' LFA keys for this community we should eject
      if (
        generateKeysResponse == null ||
        generateKeysResponse.status !== CommunityOperationStatus.SUCCESS ||
        generateKeysResponse.payload == null ||
        generateKeysResponse.payload.teamId != sigChain.team.id ||
        generateKeysResponse.payload.serverId == null ||
        generateKeysResponse.payload.identityKeys == null ||
        generateKeysResponse.payload.keys == null
      ) {
        this.logger.error(`Failed to generate server keys!`, generateKeysResponse?.reason ?? 'Response was nullish')
        return false
      }

      const lfaServer: Server = {
        host,
        serverId: generateKeysResponse.payload.serverId,
        identityKeys: generateKeysResponse.payload.identityKeys,
        keys: generateKeysResponse.payload.keys,
      }

      // add this QSS server/cluster to our chain using the keys we generated earlier
      this.logger.info(`Got a valid keys response from QSS, adding it to the chain`, lfaServer)
      if (!sigChain.team.hasServer(lfaServer.serverId)) {
        sigChain.server.addServer(lfaServer)
      }
    }

    const serializedSigChain: Uint8Array = sigChain.save()
    const serializedKeyring: Uint8Array = uint8arrays.fromString(JSON.stringify(sigChain.team.teamKeyring()), 'utf8')
    // send the serialized chain and team keys to QSS
    const qssCreateCommunityMessage: CreateCommunity = {
      ts: DateTime.utc().toMillis(),
      payload: {
        userId: (sigChain.context as MemberContext).user.userId,
        deviceId: (sigChain.context as MemberContext).device.deviceId,
        community: {
          teamId: sigChain.team.id,
          sigChain: uint8arrays.toString(serializedSigChain, 'hex'),
        },
        teamKeyring: uint8arrays.toString(serializedKeyring, 'base64'),
      },
    }

    const createCommunityResponse = await this.qssClient.sendMessage<CreateCommunityResponse>(
      WebsocketEvents.CREATE_COMMUNITY,
      qssCreateCommunityMessage,
      true
    )

    // if we didn't get a successful response from QSS when adding the community we should eject
    if (createCommunityResponse == null || createCommunityResponse.status !== CreateCommunityStatus.SUCCESS) {
      this.logger.error(`Failed to create a community!`, createCommunityResponse?.reason ?? 'Response was nullish')
      return false
    }

    const community = await this.localDbService.getCurrentCommunity()
    await this.localDbService.updateCommunity(community!.id, { qssSetup: true } as any)

    this.emit(QSSEvents.QSS_START_AUTH_CONN, sigChain.team.id)
    this.qssSyncManager.startLogSyncForSignedInTeam(sigChain.team.id, sigChain)
    return true
  }

  /** Starts periodic QSS log pulls for a team. */
  public startLogPullInterval(teamId: string): void {
    this.qssSyncManager.startLogPullInterval(teamId)
  }

  /** Notifies QSS synchronization that local team storage is ready. */
  public markTeamStorageReady(teamId: string): void {
    this.qssSyncManager.markTeamStorageReady(teamId)
  }

  /**
   * Send a sign in message to QSS and start the auth sync connection with QSS for this community
   *
   * @param teamId ID of the team we are signing in to
   * @param sigChain Sigchain for this team
   */
  public async signInToCommunity(teamId: string, sigChain: SigChain): Promise<QSSOperationResult> {
    let result: QSSOperationResult
    try {
      result = await this._signInToCommunityImpl(teamId, sigChain)
    } catch (e) {
      this.logger.error('Failed to sign in to QSS', e)
      result = QSSOperationResult.ERROR
    }

    if (result === QSSOperationResult.SUCCESS) {
      this.logger.info('Successfully signed in to QSS, starting periodic log pulls once storage is ready', teamId)
      await this.syncNativePushPrerequisites(teamId, sigChain, 'QSS sign-in')
      this.qssSyncManager.startLogSyncForSignedInTeam(teamId, sigChain)
    }

    return result
  }

  /**
   * Signs in without starting authentication and retains the resulting state
   * until authentication starts with the private admission context.
   */
  public connectForAdmission(endpoint: string): Promise<QSSOperationResult> {
    this._paused = false
    this._configureEventHandlers()
    return this.connect(endpoint)
  }

  public async prepareAdmission(teamId: string, sigChain: SigChain): Promise<PreparedQssAdmission> {
    this.clearDeviceAdmissionRetry(teamId)
    const kind = sigChain.isPendingDeviceAdmission ? AdmissionKind.DEVICE : AdmissionKind.MEMBER
    const result = await this._signInToCommunityImpl(teamId, sigChain, false)
    if (result !== QSSOperationResult.SUCCESS) {
      throw new AdmissionError('availability', `Failed to prepare QSS admission for team ${teamId}: ${result}`)
    }
    const prepared: PreparedQssAdmission = { teamId, kind }
    this.preparedAdmissions.set(teamId, { prepared, sigChain })
    return prepared
  }

  /**
   * Starts authentication; the coordinator settles the admission result separately.
   *
   * @throws When the preparation is stale or the auth connection cannot start.
   */
  public async startPreparedAdmission(prepared: PreparedQssAdmission, context: AdmissionAuthContext): Promise<void> {
    context.gate.assertCurrent()
    const state = this.preparedAdmissions.get(prepared.teamId)
    if (state == null || state.prepared !== prepared) throw new Error('QSS admission preparation is stale')
    state.context = context
    await this.qssAuthConnManager.startNewConnection(prepared.teamId, context)
    context.gate.assertCurrent()
  }

  /** Runs QSS authentication for the currently stored community immediately. */
  public async authenticateCurrentCommunity(): Promise<void> {
    await this._handleQssHandleSignIn()
  }

  /**
   * Emit everything the native push handler needs to fetch, authenticate and decrypt a
   * pushed entry while the JS backend is not running: the QSS URL and pinned server
   * identity (NSE_QSS_URL_UPDATED), the device credentials (DEVICE_CREDENTIALS_UPDATED)
   * and the LFA keys (KEYS_UPDATED).
   *
   * This runs on every successful QSS sign-in and again when a QSS join completes. On a
   * fresh invite join the sign-in happens while the chain is still an invitee context
   * with no team (the team arrives through the auth handshake a moment later), so at
   * that point none of the three values can be derived: ServerService throws "Team is
   * nullish", device credentials are skipped and the key sync dereferences a null team.
   * Nothing re-ran them once the join completed, so a freshly joined device dropped
   * every push with "no QSS URL is stored" until the next app launch (#346).
   *
   * Every emit is a put into native storage (keys are resent in full), so running this
   * at both points is idempotent. Failures are logged and never propagate: a join must
   * not fail because a push prerequisite could not be emitted. The URL and device
   * credential emits are awaited so callers can order them before QSS_FULLY_JOINED
   * (QPS flushes the pending FCM token on that event); the key sync reads the whole
   * team keyring from the local db, so it stays fire-and-forget and must never gate
   * admission.
   */
  public async syncNativePushPrerequisites(teamId: string, sigChain: SigChain, trigger: string): Promise<void> {
    if (sigChain.team == null) {
      this.logger.info(
        `Deferring native push prerequisites for team ${teamId} until the join completes (trigger: ${trigger})`
      )
      return
    }
    await this.emitNseQssUrl(this._qssEndpoint, sigChain)
    this.sigChainService.updateDeviceCredentials(teamId)
    void this.sigChainService.updateKeysInNativeStorage(teamId, true).catch(err => {
      this.logger.error(`Failed to sync keys to native storage (trigger: ${trigger})`, err)
    })
  }

  /**
   * Send a sign in message to QSS and start the auth sync connection with QSS for this community
   *
   * @param teamId ID of the team we are signing in to
   * @param sigChain Sigchain for this team
   */
  public async _signInToCommunityImpl(
    teamId: string,
    sigChain: SigChain,
    startAuthentication = true
  ): Promise<QSSOperationResult> {
    if (!this.canConnect) {
      this.logger.info(`Can't sign in to community on QSS because QSS is not enabled for this community`)
      return QSSOperationResult.DISABLED
    }

    if (!this.connected) {
      this.logger.warn(`Can't sign in to community on QSS because the client hasn't connected`)
      return QSSOperationResult.ERROR
    }

    // send a sign in message to QSS for this community and check for a successful response
    this.logger.info(`Signing in to community`, teamId)
    const qssSignInMessage: CommunitySignInMessage = {
      ts: DateTime.utc().toMillis(),
      status: CommunityOperationStatus.SENDING,
      payload: {
        userId: sigChain.userId,
        deviceId: sigChain.device.deviceId,
        teamId,
      },
    }
    const signInResponse = await this.qssClient.sendMessage<CommunitySignInMessage>(
      WebsocketEvents.SIGN_IN_COMMUNITY,
      qssSignInMessage,
      true
    )

    if (signInResponse == null) {
      throw new AdmissionError('availability', `No QSS sign-in response for team ${teamId}`)
    }

    if (signInResponse.status !== CommunityOperationStatus.SUCCESS) {
      const qssError = new Error(signInResponse.reason ?? `Unknown QSS Error`)
      throw new CompoundError(`Error while signing in to community ${teamId} - ${signInResponse.status}`, qssError)
    }

    if (startAuthentication) {
      // start the auth sync connection with QSS now that we've successfully signed in
      this.logger.trace(`Sign in request to QSS was successful, initiating LFA connection`)
      const authConnectionStarted = await this.startAuthConnection(teamId)
      if (!authConnectionStarted) {
        return QSSOperationResult.ERROR
      }
    }

    const community = await this.localDbService.getCurrentCommunity()
    await this.localDbService.updateCommunity(community!.id, { qssSetup: true } as any)
    return QSSOperationResult.SUCCESS
  }

  /**
   * Close all open auth sync connections and the QSS websocket connection
   */
  public close(): void {
    this.logger.info(`Closing QSS service`)
    this._paused = true
    this._clearReconnectTimer(true)
    this.clearDeviceAdmissionRetries()
    this.qssSyncManager.close()
    this.abortPreparedAdmissions(new Error('QSS admission aborted while service closed'))
    this._teardownEventHandlers()
    this.qssClient.off(QSSEvents.QSS_CONNECTED, this._requestCaptchaVerificationAfterConnect)
    this._captchaVerificationQueued = false
    this.qssAuthConnManager.close()
    this.qssClient.close()
  }
}
