/**
 * Abstraction layer for interacting with QSS
 */
import { Mutex } from 'async-mutex'
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
import { QSS_RECONNECT_BACKOFF_FACTOR, QSS_RECONNECT_DELAY_MS, QSS_RECONNECT_MAX_DELAY_MS } from './qss.const'
import { CompoundError, InvitationDataV3, NseQssUrlUpdatedEvent, SocketActions, SocketEvents } from '@quiet/types'
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
  private _eventHandlersConfigured = false

  private readonly logger = createLogger(`qss:service`)

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

  public onModuleDestroy() {
    this.close()
  }

  private _requestCaptchaVerificationAfterConnect = (): void => {
    this._captchaVerificationQueued = false
    this.qssClient.requestCaptchaVerification().catch(error => {
      this.logger.error('Failed to request captcha verification', error)
    })
  }

  private _handleQssDisconnected = (): void => {
    this.logger.debug('QSS disconnected, scheduling reconnect if enabled')
    this._scheduleReconnect(QSSOperationResult.ERROR)
  }

  private _handleQssAuthJoined = (teamId: string): void => {
    this.logger.debug('Auth connection joined via QSS')
    this.emit(QSSEvents.QSS_AUTH_JOINED, teamId)
  }

  private _handleStartAuthConnection = (teamId: string, teamName?: string): void => {
    void this.startAuthConnection(teamId, teamName)
  }

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

  private _handleCaptchaRequired = (): void => {
    this.logger.debug('Captcha required event received from QSS')
    this.qssClient.requestCaptchaVerification().catch(error => {
      this.logger.error('Failed to request captcha verification', error)
    })
  }

  private _handleCommunityAdded = (): void => {
    this.logger.debug('Community stored, attempting to authenticate with QSS')
    this.emit(QSSEvents.QSS_HANDLE_SIGN_IN)
  }

  private _handleQssConnected = async (): Promise<void> => {
    this.logger.debug('QSS connected, handling appropriate authentication operation')
    this.emit(QSSEvents.QSS_HANDLE_SIGN_IN)
  }

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
            ? sigChain.team.id
            : (initStatus.community.inviteData as InvitationDataV3).authData!.teamId!
        const teamName = sigChain.team != null ? sigChain.team.teamName : initStatus.community.name
        this.logger.trace('QSS Sign in', teamId, teamName)
        await this.signInToCommunity(teamId, sigChain, teamName)
      }
    })
  }

  private _handleSelfAssignMember = async (teamId: string): Promise<void> => {
    this.logger.debug(`Self-assigning ${RoleName.MEMBER} role on team ${teamId} after joining with QSS`)
    const initStatus = await this.getQssInitStatus()
    const sigchain = this.sigChainService.getChain({ teamId })
    const authData = (initStatus.community?.inviteData as InvitationDataV3).authData
    if (authData.salt != null) {
      sigchain.roles.addSelf(RoleName.MEMBER, authData.seed, authData.salt)
    }
    this.logger.trace(
      `Is user now member through self-assign?`,
      sigchain.roles.memberHasRole(sigchain.context.user.userId, RoleName.MEMBER)
    )
    this.emit(QSSEvents.QSS_FULLY_JOINED, teamId)
    this.qssAuthConnManager.markMemberRoleReady(teamId)
    this.qssSyncManager.markMemberRoleReady(teamId)
  }

  private _configureEventHandlers(): void {
    if (this._eventHandlersConfigured) {
      return
    }

    this.qssAuthConnManager.on(QSSEvents.QSS_AUTH_JOINED, this._handleQssAuthJoined)
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

  private _teardownEventHandlers(): void {
    if (!this._eventHandlersConfigured) {
      return
    }

    this.qssAuthConnManager.off(QSSEvents.QSS_AUTH_JOINED, this._handleQssAuthJoined)
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

  private async startAuthConnection(teamId: string, teamName?: string): Promise<boolean> {
    try {
      await this.qssAuthConnManager.startNewConnection(teamId, teamName)
      return true
    } catch (e) {
      this.logger.error('Failed to start QSS auth connection', e)
      return false
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
      tosAccepted: false,
      community,
    }
    if (community == null) {
      return status
    }

    return {
      ...status,
      qssEnabled: community.qssEnabled ?? false,
      qssSetup: community.qssSetup ?? false,
      tosAccepted: community.tosAccepted ?? false,
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

  public async connect(qssEndpoint: string | undefined, enabledOverride: boolean = false): Promise<QSSOperationResult> {
    if (this._paused) {
      this.logger.debug('Skipping QSS connect because service is paused')
      return QSSOperationResult.DISABLED
    }

    return await this._connectMutex.runExclusive(async () => {
      if (this._paused) {
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

  private _clearReconnectTimer(resetDelay = false): void {
    if (this._reconnectQueueProcessor != null) {
      clearTimeout(this._reconnectQueueProcessor)
      this._reconnectQueueProcessor = undefined
    }

    if (resetDelay) {
      this._reconnectDelayMs = QSS_RECONNECT_DELAY_MS
    }
  }

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

  public pause(): void {
    if (!this.canConnect) {
      this.logger.trace(`Skipping QSS pause because QSS isn't enabled`)
      return
    }

    this.logger.info('Pausing QSS service')
    this._paused = true
    this._teardownEventHandlers()
    this.qssSyncManager.pause()
    this._clearReconnectTimer(true)
    this._captchaVerificationQueued = false
    this.qssAuthConnManager.close()
    this.qssClient.close()
  }

  public async resume(): Promise<void> {
    if (!this.canConnect) {
      this.logger.trace(`Skipping QSS resume because QSS isn't enabled`)
      return
    }

    this.logger.info(`Resuming QSS service`)
    this._paused = false
    this._configureEventHandlers()
    this.qssSyncManager.resume()
    await this.connect(this.qssEndpoint, this._enabledOverride)
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

    const initStatus = await this.getQssInitStatus()
    if (!initStatus.tosAccepted) {
      this.logger.warn(`Can't connect to QSS until TOS is accepted`)
      return QSSOperationResult.ERROR
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

    // wait for our socket to finish connecting
    let connStatus: QSSOperationResult
    try {
      this.logger.info(`Establishing connection with QSS`)
      await this.qssClient.createSocketAndConnect(this._qssEndpoint)
      this.logger.info(`Connection established`)
      connStatus = QSSOperationResult.SUCCESS
    } catch (e) {
      this.logger.info(`Error while connecting to QSS`, e.message)
      connStatus = QSSOperationResult.ERROR
    }

    return connStatus
  }

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

  private async emitNseQssUrl(wsUrl: string | undefined): Promise<void> {
    const platform = process.platform as string
    if (platform !== 'ios' && platform !== 'android') {
      this.logger.debug('Skipping NSE QSS URL emit because platform is not iOS or Android', platform)
      return
    }
    try {
      const community = await this.localDbService.getCurrentCommunity()
      const teamId = community?.teamId ?? this.sigChainService.getActiveChain(false)?.team?.id
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

      const payload: NseQssUrlUpdatedEvent = {
        teamId,
        qssUrl,
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
   * @param community Community metadata for this community
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
    const initStatus = await this.getQssInitStatus()
    if (!this.canConnect) {
      this.logger.trace(`Can't create community on QSS because QSS is not initialized`)
      return false
    }

    if (!initStatus.tosAccepted) {
      this.logger.warn(`Can't create community on QSS until TOS is accepted`)
      return false
    }

    if (sigChain.team == null) {
      throw new Error(`Team on this sigchain is nullish!`)
    }

    if (initStatus.community == null) {
      this.logger.warn(`Can't create community on QSS until the community is initialized locally`)
      return false
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
    if (
      /^(127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|localhost)$/.test(
        host
      ) &&
      process.env.NODE_ENV !== 'production'
    ) {
      host = 'localhost'
    }

    await this.localDbService.setCommunity({
      ...initStatus.community,
      qssEnabled: true,
      serverHosts: [{ hostUrl: host, accepted: true }],
    })

    // if we don't already have this server in our chain we need to generate keys and add it
    if (!sigChain.team.hasServer(host)) {
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
        generateKeysResponse.payload.keys == null
      ) {
        this.logger.error(`Failed to generate server keys!`, generateKeysResponse?.reason ?? 'Response was nullish')
        return false
      }

      const lfaServer: Server = {
        host,
        keys: generateKeysResponse.payload.keys,
      }

      // add this QSS server/cluster to our chain using the keys we generated earlier
      this.logger.info(`Got a valid keys response from QSS, adding it to the chain`, lfaServer)
      if (!sigChain.team.hasServer(host)) {
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

  public startLogPullInterval(teamId: string): void {
    this.qssSyncManager.startLogPullInterval(teamId)
  }

  public markTeamStorageReady(teamId: string): void {
    this.qssSyncManager.markTeamStorageReady(teamId)
  }

  /**
   * Send a sign in message to QSS and start the auth sync connection with QSS for this community
   *
   * @param teamId ID of the team we are signing in to
   * @param sigChain Sigchain for this team
   * @param teamName Optional team name to pass in for filtering purposes
   */
  public async signInToCommunity(teamId: string, sigChain: SigChain, teamName?: string): Promise<QSSOperationResult> {
    let result: QSSOperationResult
    try {
      result = await this._signInToCommunityImpl(teamId, sigChain, teamName)
    } catch (e) {
      this.logger.error('Failed to sign in to QSS', e)
      result = QSSOperationResult.ERROR
    }

    if (result === QSSOperationResult.SUCCESS) {
      this.logger.info('Successfully signed in to QSS, starting periodic log pulls once storage is ready', teamId)
      await this.emitNseQssUrl(this._qssEndpoint)
      this.qssSyncManager.startLogSyncForSignedInTeam(teamId, sigChain)
    }

    return result
  }

  /**
   * Send a sign in message to QSS and start the auth sync connection with QSS for this community
   *
   * @param teamId ID of the team we are signing in to
   * @param sigChain Sigchain for this team
   * @param teamName Optional team name to pass in for filtering purposes
   */
  public async _signInToCommunityImpl(
    teamId: string,
    sigChain: SigChain,
    teamName?: string
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
      status: CommunityOperationStatus.SUCCESS,
      payload: {
        userId: (sigChain.context as MemberContext).user.userId,
        teamId,
      },
    }
    const signInResponse = await this.qssClient.sendMessage<CommunitySignInMessage>(
      WebsocketEvents.SIGN_IN_COMMUNITY,
      qssSignInMessage,
      true
    )

    if (signInResponse == null) {
      throw new Error(`Error while signing in to community ${teamId} - Nullish response from QSS`)
    }

    if (signInResponse.status !== CommunityOperationStatus.SUCCESS) {
      const qssError = new Error(signInResponse.reason ?? `Unknown QSS Error`)
      throw new CompoundError(`Error while signing in to community ${teamId} - ${signInResponse.status}`, qssError)
    }

    // start the auth sync connection with QSS now that we've successfully signed in
    this.logger.trace(`Sign in request to QSS was successful, initiating LFA connection`)
    const authConnectionStarted = await this.startAuthConnection(teamId, teamName)
    if (!authConnectionStarted) {
      return QSSOperationResult.ERROR
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
    this.qssSyncManager.close()
    this._teardownEventHandlers()
    this.qssClient.off(QSSEvents.QSS_CONNECTED, this._requestCaptchaVerificationAfterConnect)
    this._captchaVerificationQueued = false
    this.qssAuthConnManager.close()
    this.qssClient.close()
    this._connecting = false
  }
}
