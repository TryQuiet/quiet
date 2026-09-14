import * as uint8arrays from 'uint8arrays'
import fs from 'fs'
import path from 'path'
import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { EventEmitter } from 'events'
import getPort from 'get-port'
import { Agent } from 'https'
import { CryptoEngine, setEngine } from 'pkijs'
import { createPeerId, generateLibp2pPSK } from '../common/utils'

import {
  createLibp2pAddress,
  createLocalAddress,
  isLocalTransportEnabled,
  isPSKcodeValid,
  parseLocalAddress,
} from '@quiet/common'
import {
  ChannelMessageIdsResponse,
  ChannelSubscribedPayload,
  ChannelsReplicatedPayload,
  Community,
  ConnectionProcessInfo,
  CreateChannelPayload,
  CreateChannelResponse,
  DeleteFilesFromChannelSocketPayload,
  DownloadStatus,
  ErrorMessages,
  FileMetadata,
  GetMessagesPayload,
  MessagesLoadedPayload,
  NetworkInfo,
  NetworkStats,
  PushNotificationPayload,
  RemoveDownloadStatus,
  SocketActions,
  SocketEvents,
  AttachFilePayload,
  type DeleteChannelResponse,
  type UserProfile,
  type UserProfilesStoredEvent,
  Identity,
  PeerId as QuietPeerId,
  InvitationDataVersion,
  PermissionsError,
  CommunityOwnership,
  InitCommunityPayload,
  ResponseCreateCommunityPayload,
  ResponseJoinCommunityPayload,
  RequestInvitePayload,
  ResponseInvitePayload,
  LaunchCommunityPayload,
  ChannelMessage,
  DownloadFilePayload,
  DeleteChannelPayload,
  SetUserProfilePayload,
  SetUserProfileResponse,
  AddMembersChannelPayload,
  AddMembersChannelResponse,
  PublicChannel,
  User,
  UserProfilesUpdatedPayload,
  UpdateCommunityPayload,
  ChannelOperationStatus,
  type PrivateChannelPermissions,
  type SetChannelPermissionsPayload,
  type MobileChannelMetadata,
  type MobileChannelMetadataUpdatedPayload,
  type DeviceInvitationData,
  isDeviceInvitationData,
  type InitDeviceLinkPayload,
  type ResponseLinkDevicePayload,
  type RequestDeviceLinkPayload,
  type DeviceLinkInvite,
} from '@quiet/types'
import { CONFIG_OPTIONS, QSS_ALLOWED, QSS_ENDPOINT, SERVER_IO_PROVIDER, SOCKS_PROXY_AGENT } from '../const'
import { Libp2pService, Libp2pState } from '../libp2p/libp2p.service'
import { CreatedLibp2pPeerId, Libp2pEvents, Libp2pNodeParams } from '../libp2p/libp2p.types'
import { LocalDbService } from '../local-db/local-db.service'
import { LocalDBKeys } from '../local-db/local-db.types'
import { emitError } from '../socket/socket.errors'
import { SocketService } from '../socket/socket.service'
import { StorageService } from '../storage/storage.service'
import { StorageEvents } from '../storage/storage.types'
import { Tor } from '../tor/tor.service'
import { ConfigOptions, GetPorts, ServerIoProviderTypes } from '../types'
import {
  AdmissionError,
  type AdmissionInProgressMarker,
  type InvitationAdmissionType,
  type PendingAdmissionAttempt,
  ServiceState,
  TorInitState,
} from './connections-manager.types'
import { DateTime } from 'luxon'
import { createLogger } from '../common/logger'
import { peerIdFromString } from '@libp2p/peer-id'
import { privateKeyFromRaw } from '@libp2p/crypto/keys'
import { SigChainService } from '../auth/sigchain.service'
import { QSSService } from '../qss/qss.service'
import { RoleName } from '../auth/services/roles/roles'
import { QSSEvents, type QSSAuthErrorPayload } from '../qss/qss.types'
import { SigchainEvents } from '../auth/types'
import { QPSService } from '../qps/qps.service'
import { CaptchaService } from '../captcha/captcha.service'
import { SigChain } from '../auth/sigchain'
import { Member } from '@localfirst/auth'
import type { PrivateChannelMappings } from '../storage/channels/channels.types'

const DEFAULT_INVITATION_ADMISSION_TIMEOUT_MS = 300_000
const configuredE2eAdmissionTimeout = Number(process.env.INVITATION_ADMISSION_TIMEOUT_MS)
// Keep production admission timing fixed, while allowing the desktop E2E suite
// to exercise the complete timeout recovery flow without a five-minute wait.
const INVITATION_ADMISSION_TIMEOUT_MS =
  process.env.IS_E2E === 'true' && Number.isFinite(configuredE2eAdmissionTimeout) && configuredE2eAdmissionTimeout > 0
    ? configuredE2eAdmissionTimeout
    : DEFAULT_INVITATION_ADMISSION_TIMEOUT_MS

/**
 * A monolith service that handles lots of events received from the state-manager.
 */
@Injectable()
export class ConnectionsManagerService extends EventEmitter implements OnModuleInit {
  public communityId: string
  public communityState: ServiceState
  private hibernating = false
  private hibernateInFlight: Promise<void> | null = null
  private wakeInFlight: Promise<void> | null = null
  /** The manager-owned lifecycle for invitation admission. */
  private pendingAdmissionAttempt?: PendingAdmissionAttempt
  private admissionGeneration = 0
  private timedOutAdmissionCommunityId?: string
  private interruptedAdmissionCommunityId?: string
  private clearedAdmissionCommunityId?: string
  private admissionResetInFlight?: Promise<boolean>
  private restoredAdmissionMarker?: AdmissionInProgressMarker
  private storedCommunityInitialization: Promise<void> | undefined
  private ports: GetPorts
  isTorInit: TorInitState = TorInitState.NOT_STARTED

  private readonly logger = createLogger(ConnectionsManagerService.name)
  constructor(
    @Inject(SERVER_IO_PROVIDER) public readonly serverIoProvider: ServerIoProviderTypes,
    @Inject(CONFIG_OPTIONS) public configOptions: ConfigOptions,
    @Inject(SOCKS_PROXY_AGENT) public readonly socksProxyAgent: Agent,
    @Inject(QSS_ALLOWED) private readonly qssAllowed: boolean,
    @Inject(QSS_ENDPOINT) private readonly qssEndpoint: string | undefined,
    private readonly socketService: SocketService,
    public readonly libp2pService: Libp2pService,
    private readonly localDbService: LocalDbService,
    private readonly storageService: StorageService,
    private readonly tor: Tor,
    private readonly sigChainService: SigChainService,
    private readonly qssService: QSSService,
    private readonly qpsService: QPSService,
    private readonly captchaService: CaptchaService
  ) {
    super()
  }

  public getQssService(): QSSService {
    return this.qssService
  }

  async onModuleInit() {
    setEngine(
      'newEngine',
      // @ts-ignore
      new CryptoEngine({
        name: 'newEngine',
        // @ts-ignore
        crypto: global.crypto,
      })
    )

    this.logger.info('QSS_ENDPOINT', this.qssEndpoint)

    await this.init()
  }

  private async generatePorts() {
    const controlPort = await getPort()
    const socksPort = await getPort()
    const libp2pHiddenService = await getPort()
    const dataServer = await getPort()
    const httpTunnelPort = await getPort()

    this.ports = {
      socksPort,
      libp2pHiddenService,
      controlPort,
      dataServer,
      httpTunnelPort,
    }
  }

  public async init() {
    this.logger.info('init')
    this.communityState = ServiceState.DEFAULT
    await this.generatePorts()
    if (!this.configOptions.httpTunnelPort) {
      this.configOptions.httpTunnelPort = await getPort()
    }

    this.attachSocketServiceListeners()
    this.attachTorEventsListeners()
    this.attachStorageListeners()
    this.attachSigchainListeners()

    if (this.localDbService.getStatus() === 'closed') {
      await this.localDbService.open()
    }

    void this.initializeStoredCommunity().catch(error => {
      this.logger.error('Stored community initialization failed', error)
    })
  }

  /**
   * Runs migration and stored-community launch once, independently of backend
   * readiness and Tor availability.
   */
  public initializeStoredCommunity(): Promise<void> {
    if (!this.storedCommunityInitialization) {
      this.storedCommunityInitialization = (async () => {
        await this.migrateLevelDb()
        await this.launchCommunityFromStorage()
      })()
    }
    return this.storedCommunityInitialization
  }

  /**
   * Migrate LevelDB when upgrading Quiet for existing communities
   *
   * Move data from Redux in the frontend to LevelDB in the backend for existing
   * communities when upgrading. Hopefully this will make features easier to
   * test and develop. In order to do this, we need the data to be accessible on
   * the backend before it's first used. Since the backend starts up
   * asynchronously, independent of the frontend, we wait for the frontend to
   * load migration data before launching the community.
   */
  public async migrateLevelDb(): Promise<void> {
    // Empty promise used to wait on a callback below
    let onDataReceived: () => void
    const dataReceivedPromise = new Promise<void>((resolve: () => void) => {
      onDataReceived = resolve
    })

    // TODO: add migration of network info in COMMUNITY to IDENTITY
    // This is related to a specific migration, perhaps there is a way to
    // encapsulate this in LocalDbService.
    const keys = [LocalDBKeys.CURRENT_COMMUNITY_ID, LocalDBKeys.COMMUNITIES, LocalDBKeys.IDENTITIES]
    const keysRequired: string[] = []

    for (const key of keys) {
      if (!(await this.localDbService.exists(key))) {
        keysRequired.push(key)
      }
    }

    this.socketService.on(SocketActions.LOAD_MIGRATION_DATA, async (data: Record<string, any>) => {
      this.logger.info('Migrating LevelDB')
      await this.localDbService.load(data)
      onDataReceived()
    })

    // Only require migration data for existing communities. We can tell because
    // they are using the deprecated COMMUNITY key in LevelDB. This is related
    // to a specific migration. Perhaps we want a more general purpose migration
    // mechanism, like a table to hold migrations that have already been
    // applied.
    if ((await this.localDbService.exists(LocalDBKeys.COMMUNITY)) && keysRequired.length > 0) {
      this.logger.info('Migration data required:', keysRequired)
      this.serverIoProvider.io.emit(SocketEvents.MIGRATION_DATA_REQUIRED, keysRequired)
      await dataReceivedPromise
    } else {
      this.logger.info('Nothing to migrate')
    }
  }

  public async launchCommunityFromStorage() {
    this.logger.info('Launching community from storage')

    // Defense in depth for #3225: if a leaveCommunity crashed mid-way, finish the purge
    // before doing anything else — including reading CURRENT_COMMUNITY_ID. The marker is
    // written at the start of leaveCommunity and cleared at full success, so its presence
    // is unambiguous: the user intended to leave. Whether CURRENT_COMMUNITY_ID happens to
    // still be set depends on exactly when the crash hit (it's cleared by resetState() near
    // the end of leaveCommunity), so we cannot use its absence as the signal.
    if (this.leaveInProgressMarkerExists()) {
      this.logger.info('Interrupted leaveCommunity detected at startup; finishing purge')
      await this.localDbService.purgeArtifacts()
      this.storageService.purgeData()
      this.clearLeaveInProgressMarker()
      return
    }

    this.restoredAdmissionMarker = this.readAdmissionInProgressMarker()
    if (this.restoredAdmissionMarker) {
      this.interruptedAdmissionCommunityId = this.restoredAdmissionMarker.communityId
      this.logger.info(`Interrupted ${this.restoredAdmissionMarker.invitationType} admission detected at startup`)
    }

    const community: Community | undefined = await this.localDbService.getCurrentCommunity()
    if (!community) {
      // Absent marker + no community = fresh install or a pending LevelDB migration where
      // CURRENT_COMMUNITY_ID hasn't been populated from the renderer's persistor yet. Don't
      // purge speculatively — that was the backwards-compatibility regression.
      this.logger.info('No community found in storage')
      return
    }

    if (community.name) {
      try {
        this.logger.info('Loading sigchain for community', community.name)
        await this.sigChainService.loadChain(community.teamId, true)
      } catch (e) {
        this.logger.error('Failed to load sigchain', e)
        if (this.restoredAdmissionMarker?.communityId === community.id) {
          this.communityState = ServiceState.DEFAULT
          emitError(this.serverIoProvider.io, {
            type: SocketActions.LAUNCH_COMMUNITY,
            message: ErrorMessages.ADMISSION_INTERRUPTED,
            community: community.id,
            trace: (e as Error).stack,
          })
          return
        }
        await this.localDbService.deleteCommunity(community.id)
        await this.sigChainService.deleteChain(community.teamId, true)
        return
      }
    } else {
      this.logger.warn('No community name found in storage')
    }

    await this.launchCommunity(community.id)
  }

  public async closeSocket() {
    await this.socketService.close()
  }

  public async saveActiveChain() {
    try {
      await this.sigChainService.saveChain(this.sigChainService.activeChainTeamId!)
    } catch (e) {
      this.logger.info('Failed to save active chain', e)
    }
  }

  public async pause() {
    this.logger.info('Pausing!')
    this.qssService.pause()
    await this.libp2pService?.pause()
    this.logger.info('Pausing libp2pService!')
  }

  public async resume() {
    this.logger.info('Resuming!')
    await this.libp2pService?.resume()
    await this.qssService.resume()
  }

  /**
   * Hibernate: flush state to disk and pause all networking. Keeps the node
   * process and Nest context alive so wake() can bring the app back without a
   * cold start. Survives Android low-memory kill because sigchain is persisted.
   */
  public async hibernate() {
    if (this.hibernating) {
      this.logger.info('hibernate: already hibernated, skipping')
      return
    }
    if (this.hibernateInFlight) return this.hibernateInFlight
    if (this.wakeInFlight) {
      this.logger.info('hibernate: waiting for in-flight wake to finish before hibernating')
      try {
        await this.wakeInFlight
      } catch (e) {
        this.logger.error('hibernate: in-flight wake failed', e)
      }
    }

    this.hibernateInFlight = (async () => {
      this.logger.info('Hibernating!')
      try {
        await this.saveActiveChain()
      } catch (e) {
        this.logger.error('hibernate: saveActiveChain failed', e)
      }
      try {
        await this.pause()
      } catch (e) {
        this.logger.error('hibernate: pause failed', e)
      }
      if (this.storageService) {
        try {
          this.logger.info('hibernate: stopping OrbitDB sync')
          await this.storageService.stopSync()
        } catch (e) {
          this.logger.error('hibernate: storage.stopSync failed', e)
        }
      }
      if (this.tor) {
        try {
          this.logger.info('hibernate: killing tor')
          await this.tor.kill()
        } catch (e) {
          this.logger.error('hibernate: tor.kill failed', e)
        }
      }
      this.hibernating = true
      this.logger.info('Hibernated')
    })()
    try {
      await this.hibernateInFlight
    } finally {
      this.hibernateInFlight = null
    }
  }

  /**
   * Wake from hibernate. Re-spawns Tor (if killed), re-opens onions, resumes
   * libp2p + QSS + socket. Safe to call when not hibernated (no-op if tor still
   * alive and services already resumed).
   */
  public async wake() {
    if (!this.hibernating && !this.hibernateInFlight) {
      this.logger.info('wake: not hibernated, skipping')
      return
    }
    if (this.wakeInFlight) return this.wakeInFlight
    if (this.hibernateInFlight) {
      this.logger.info('wake: waiting for in-flight hibernate to finish before waking')
      try {
        await this.hibernateInFlight
      } catch (e) {
        this.logger.error('wake: in-flight hibernate failed', e)
      }
    }

    this.wakeInFlight = (async () => {
      this.logger.info('Waking!')
      if (this.tor) {
        try {
          await this.tor.init()
        } catch (e) {
          this.logger.error('wake: tor.init failed', e)
        }
      }
      try {
        await this.resume()
      } catch (e) {
        this.logger.error('wake: resume failed', e)
      }
      if (this.storageService) {
        try {
          this.logger.info('wake: restarting OrbitDB sync')
          await this.storageService.startSync()
        } catch (e) {
          this.logger.error('wake: storage.startSync failed', e)
        }
      }
      this.hibernating = false
      this.logger.info('Woke')
    })()
    try {
      await this.wakeInFlight
    } finally {
      this.wakeInFlight = null
    }
  }

  // Reopen the socket and wait for the frontend handshake. Workflows such as
  // leaveCommunity use this stronger readiness guarantee before completing.
  public async openSocket() {
    await this.socketService.init()
  }

  public async closeAllServices(
    options: { saveTor: boolean; closeDatastore: boolean; deleteChainFromDisk: boolean } = {
      saveTor: false,
      closeDatastore: true,
      deleteChainFromDisk: false,
    }
  ) {
    this.logger.info('Closing services', options)

    if (!options.deleteChainFromDisk) {
      this.logger.info('Saving active sigchain')
      try {
        await this.saveActiveChain()
      } catch (e) {
        this.logger.error('Error while saving active sigchain', e)
      }
    }

    await this.closeSocket()

    if (this.qssService) {
      this.logger.info('Closing QSS service')
      this.qssService.close()
    }

    if (this.tor && !options.saveTor) {
      this.logger.info('Killing tor')
      await this.tor.kill()
    } else if (options.saveTor) {
      this.logger.info('Saving tor')
    }
    if (this.storageService && options.closeDatastore) {
      this.logger.info('Stopping StorageService')
      await this.storageService?.stop()
    }
    if (this.libp2pService) {
      this.logger.info('Stopping libp2p')
      await this.libp2pService.close(options.closeDatastore)
    }

    await this.sigChainService.deleteChain(this.sigChainService.activeChainTeamId!, options.deleteChainFromDisk)

    if (this.localDbService) {
      this.logger.info('Closing local DB')
      await this.localDbService.close()
    }
  }

  public async leaveCommunity(): Promise<boolean> {
    this.logger.info('Running leaveCommunity')
    // #3225: write a marker before any state change so a startup after a crashed leave can
    // detect and finish the purge. Cleared at the end of this function on full success;
    // anything that throws between leaves the marker in place.
    this.writeLeaveInProgressMarker()
    this.logger.info('Tombstoning notification tokens before leave')
    const tombstoneAcked = await this.qpsService.tombstoneCurrentUserNotificationTokens()
    if (!tombstoneAcked) {
      this.logger.warn('Proceeding with leave without confirmed notification token tombstone ack')
    }

    this.logger.info('Resetting captcha tokens before leave')
    this.captchaService.reset()

    await this.closeAllServices({ saveTor: true, closeDatastore: false, deleteChainFromDisk: true })

    this.logger.info('Resetting StorageService')
    await this.storageService.clean()

    this.logger.info('Cleaning libp2p datastore')
    await this.libp2pService.cleanDatastore()

    this.logger.info('Closing libp2p datastore')
    await this.libp2pService.closeDatastore()

    this.logger.info('Purging data')
    this.storageService.purgeData()

    this.logger.info('Resetting Tor')
    this.tor.resetHiddenServices()

    this.logger.info('Resetting state')
    await this.resetState()

    this.logger.info('Reopening local DB')
    await this.localDbService.open()

    this.logger.info('Restarting socket')
    await this.openSocket()

    this.logger.info('Resuming QSS service')
    await this.qssService.resume()

    this.clearLeaveInProgressMarker()
    return true
  }

  /**
   * Clear a failed pending device admission. The community id is part of the
   * contract so a stale recovery action cannot erase a newer community.
   * Cleanup is shared by concurrent requests and the completed id makes a lost
   * socket acknowledgement safe to retry.
   */
  public async resetAdmission(communityId: string): Promise<boolean> {
    if (
      communityId &&
      communityId === this.clearedAdmissionCommunityId &&
      this.communityState === ServiceState.DEFAULT
    ) {
      return true
    }

    const isFailedAttempt =
      !!communityId &&
      (communityId === this.timedOutAdmissionCommunityId || communityId === this.interruptedAdmissionCommunityId)
    if (!isFailedAttempt || this.communityState !== ServiceState.DEFAULT) return false
    if (this.admissionResetInFlight) return this.admissionResetInFlight

    const attempt = this.pendingAdmissionAttempt
    const reset = (async () => {
      // Invalidate before any transport or storage cleanup. Every callback from
      // the old attempt will then fail its generation check.
      if (attempt && attempt.communityId === communityId) {
        this.invalidatePendingAdmission(
          attempt,
          new AdmissionError('cancelled', `Admission for ${communityId} was interrupted`)
        )
        if (attempt.closePromise) {
          try {
            await attempt.closePromise
          } catch (error) {
            this.logger.warn('Retrying admission transport shutdown after an earlier failure', error)
            attempt.closePromise = this.closeAdmissionTransports()
            await attempt.closePromise
          }
        } else {
          attempt.closePromise = this.closeAdmissionTransports()
          await attempt.closePromise
        }
      } else {
        ++this.admissionGeneration
        await this.closeAdmissionTransports()
      }

      await this.erasePreviousCommunityArtifacts()
      this.captchaService.reset()
      await this.qssService.resume()
      this.clearAdmissionInProgressMarker()
      if (attempt) this.finishPendingAdmissionAttempt(attempt)
      this.timedOutAdmissionCommunityId = undefined
      this.interruptedAdmissionCommunityId = undefined
      this.clearedAdmissionCommunityId = communityId
      return true
    })()
    this.admissionResetInFlight = reset
    try {
      return await reset
    } finally {
      this.admissionResetInFlight = undefined
    }
  }

  private static readonly LEAVE_IN_PROGRESS_MARKER = '.leave-in-progress'
  private static readonly ADMISSION_IN_PROGRESS_MARKER = '.admission-in-progress'

  private leaveInProgressMarkerPath(): string {
    return path.join(this.storageService.quietDir, ConnectionsManagerService.LEAVE_IN_PROGRESS_MARKER)
  }

  private admissionInProgressMarkerPath(): string {
    return path.join(this.storageService.quietDir, ConnectionsManagerService.ADMISSION_IN_PROGRESS_MARKER)
  }

  private writeAdmissionInProgressMarker(marker: AdmissionInProgressMarker): void {
    fs.mkdirSync(this.storageService.quietDir, { recursive: true })
    fs.writeFileSync(this.admissionInProgressMarkerPath(), JSON.stringify(marker))
  }

  private readAdmissionInProgressMarker(): AdmissionInProgressMarker | undefined {
    try {
      const parsed = JSON.parse(
        fs.readFileSync(this.admissionInProgressMarkerPath(), 'utf8')
      ) as Partial<AdmissionInProgressMarker>
      if (
        typeof parsed.communityId === 'string' &&
        (parsed.invitationType === 'community' || parsed.invitationType === 'device')
      ) {
        return parsed as AdmissionInProgressMarker
      }
      this.logger.warn('Ignoring invalid admission-in-progress marker')
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        this.logger.warn('Failed to read admission-in-progress marker', error)
      }
    }
    return undefined
  }

  private clearAdmissionInProgressMarker(): void {
    try {
      fs.unlinkSync(this.admissionInProgressMarkerPath())
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        this.logger.warn('Failed to clear admission-in-progress marker', error)
      }
    }
    this.restoredAdmissionMarker = undefined
  }

  private writeLeaveInProgressMarker(): void {
    try {
      fs.mkdirSync(this.storageService.quietDir, { recursive: true })
      fs.writeFileSync(this.leaveInProgressMarkerPath(), new Date().toISOString())
    } catch (e) {
      this.logger.warn('Failed to write leave-in-progress marker; continuing', e)
    }
  }

  private clearLeaveInProgressMarker(): void {
    try {
      fs.unlinkSync(this.leaveInProgressMarkerPath())
    } catch (e) {
      // Marker may legitimately not exist (e.g. cleared by a previous successful leave or
      // by the startup recovery path). Anything else is best-effort; swallow.
    }
  }

  private leaveInProgressMarkerExists(): boolean {
    try {
      return fs.existsSync(this.leaveInProgressMarkerPath())
    } catch {
      return false
    }
  }

  private async erasePreviousCommunityArtifacts(): Promise<void> {
    this.logger.info('Erasing previous community artifacts before creating or joining a community')

    if (this.storageService) {
      this.logger.info('Cleaning storage service')
      await this.storageService.clean()
    }

    if (this.libp2pService) {
      this.logger.info('Stopping libp2p without closing datastore')
      await this.libp2pService.close(false)

      this.logger.info('Cleaning libp2p datastore')
      await this.libp2pService.cleanDatastore()

      this.logger.info('Closing libp2p datastore')
      await this.libp2pService.closeDatastore()
    }

    if (this.sigChainService.activeChainTeamId != null) {
      await this.sigChainService.deleteChain(this.sigChainService.activeChainTeamId, true)
    }

    if (this.localDbService) {
      this.logger.info('Purging local DB artifacts')
      await this.localDbService.purgeArtifacts()
    }

    if (this.storageService) {
      this.logger.info('Purging storage data')
      this.storageService.purgeData({ removeTorDataDirectory: false })
    }

    this.logger.info('Resetting Tor hidden services')
    this.tor.resetHiddenServices()

    this.logger.info('Resetting community state')
    await this.resetState()

    this.logger.info('Reopening local DB')
    await this.localDbService.open()
  }

  async resetState() {
    this.communityId = ''
    this.ports = { ...this.ports, libp2pHiddenService: await getPort() }
    this.communityState = ServiceState.DEFAULT
  }

  public async getNetworkInfo(): Promise<NetworkInfo> {
    this.logger.info('Getting network information')

    const hiddenService = isLocalTransportEnabled()
      ? {
          onionAddress: createLocalAddress(this.ports.libp2pHiddenService),
          privateKey: '',
        }
      : await this.createEphemeralHiddenService()
    this.logger.info('Getting peer ID')
    const peerId = await createPeerId()
    const peerIdJson: QuietPeerId = {
      id: peerId.peerId.toString(),
      privKey: uint8arrays.toString(peerId.privKey.raw, 'base64'),
    }
    this.logger.info(`Created network for peer ${peerId.toString()}. Address: ${hiddenService.onionAddress}`)

    return {
      hiddenService,
      peerId: peerIdJson,
    }
  }

  private async createEphemeralHiddenService(): Promise<NetworkInfo['hiddenService']> {
    this.logger.info('Creating hidden service')
    const hiddenService = await this.tor.createNewHiddenService({ targetPort: this.ports.libp2pHiddenService })
    await this.tor.destroyHiddenService(hiddenService.onionAddress.split('.')[0])
    return hiddenService
  }

  public async createCommunity(payload: InitCommunityPayload): Promise<ResponseCreateCommunityPayload | undefined> {
    this.logger.info('Creating community', payload.id)
    await this.erasePreviousCommunityArtifacts()

    this.logger.info(`Creating new LFA chain`)
    const sigchain = await this.sigChainService.createChain(true)
    const network = await this.getNetworkInfo()

    const identity: Identity = {
      communityId: payload.id,
      userId: this.sigChainService.user.userId,
      networkInfo: network,
      joinTimestamp: null,
    }
    await this.storageService.setIdentity(identity)

    const localAddress = createLibp2pAddress(
      identity.networkInfo.hiddenService.onionAddress,
      identity.networkInfo.peerId.id
    )

    const community: Community = {
      id: payload.id,
      name: payload.name,
      peerList: [localAddress],
      psk: generateLibp2pPSK().psk,
      ownership: CommunityOwnership.Owner,
      teamId: sigchain.teamId!,
      qssEnabled: this.qssAllowed && payload.useServer,
      qssEndpoint: this.qssEndpoint,
      tosAccepted: payload.tosAccepted,
    }

    await this.localDbService.setCommunity(community)
    await this.localDbService.setCurrentCommunityId(community.id)

    await this.launchCommunity(community.id)

    const userProfile: UserProfile = {
      userId: identity.userId,
      nickname: payload.username,
      userData: {
        onionAddress: identity.networkInfo.hiddenService.onionAddress,
        peerId: identity.networkInfo.peerId.id,
      },
    }
    this.storageService.addUserProfile(userProfile)

    return {
      id: community.id,
      community: community,
      identity: identity,
      profile: userProfile,
    } as ResponseCreateCommunityPayload
  }

  public async joinCommunity(payload: InitCommunityPayload): Promise<ResponseJoinCommunityPayload | undefined> {
    this.logger.info('Joining community', payload.id)
    const inviteData = payload.inviteData
    if (!inviteData) {
      emitError(this.serverIoProvider.io, {
        type: SocketActions.JOIN_COMMUNITY,
        message: ErrorMessages.INVITE_DATA_REQUIRED,
        community: payload.id,
      })
      return
    }
    if (!isPSKcodeValid(inviteData.psk)) {
      emitError(this.serverIoProvider.io, {
        type: SocketActions.JOIN_COMMUNITY,
        message: ErrorMessages.NETWORK_SETUP_FAILED,
        community: payload.id,
      })
      return
    }

    await this.erasePreviousCommunityArtifacts()

    const { communityName, seed, teamId } = inviteData.authData
    await this.sigChainService.createChainFromInvite({ seed }, teamId, true)

    if (!isPSKcodeValid(inviteData.psk)) {
      emitError(this.serverIoProvider.io, {
        type: SocketActions.JOIN_COMMUNITY,
        message: ErrorMessages.NETWORK_SETUP_FAILED,
        community: payload.id,
      })
      return
    }

    const network = await this.getNetworkInfo()

    const identity: Identity = {
      communityId: payload.id,
      userId: this.sigChainService.user.userId,
      networkInfo: network,
      joinTimestamp: null,
    }
    await this.storageService.setIdentity(identity)

    const localAddress = createLibp2pAddress(
      identity.networkInfo.hiddenService.onionAddress,
      identity.networkInfo.peerId.id
    )
    const bootstrapPeerStats: Record<string, NetworkStats> = {}
    for (const pair of inviteData.pairs) {
      const multiaddr = createLibp2pAddress(pair.onionAddress, pair.peerId)
      bootstrapPeerStats[pair.peerId] = {
        peerId: pair.peerId,
        address: multiaddr,
        connectionTime: 0,
        lastSeen: DateTime.utc().toSeconds(),
      } as NetworkStats
    }
    // this adds bootstrap peers to the local db with the expectation that they are replaced once the user connects
    await this.localDbService.updatePeerStats(bootstrapPeerStats)

    const community: Community = {
      id: payload.id,
      name: communityName,
      peerList: [...new Set([localAddress, ...Object.keys(bootstrapPeerStats)])], // TODO: we should deprecate this field and use db
      inviteData,
      psk: inviteData.psk,
      teamId,
      ownership: CommunityOwnership.User,
      qssEnabled: inviteData.version === InvitationDataVersion.v5 ? inviteData.qssEnabled : undefined,
      qssEndpoint: inviteData.version === InvitationDataVersion.v5 ? inviteData.qssEndpoint : undefined,
    }

    await this.localDbService.setCommunity(community)
    await this.localDbService.setCurrentCommunityId(community.id)

    const userProfile: UserProfile = {
      userId: identity.userId,
      nickname: payload.username,
      userData: {
        onionAddress: identity.networkInfo.hiddenService.onionAddress,
        peerId: identity.networkInfo.peerId.id,
      },
    }
    await this.storageService.deferUserProfile(userProfile)
    this.ensurePendingAdmissionAttempt(community.id, 'community')

    return {
      id: community.id,
      community: community,
      identity: identity,
      profile: userProfile,
    } as ResponseJoinCommunityPayload
  }

  public async linkDevice(payload: InitDeviceLinkPayload): Promise<ResponseLinkDevicePayload | undefined> {
    this.logger.info('Linking device to community', payload.id)
    const { inviteData } = payload
    if (!isDeviceInvitationData(inviteData)) {
      emitError(this.serverIoProvider.io, {
        type: SocketActions.LINK_DEVICE,
        message: ErrorMessages.INVITE_DATA_REQUIRED,
        community: payload.id,
      })
      return
    }
    if (!isPSKcodeValid(inviteData.psk)) {
      emitError(this.serverIoProvider.io, {
        type: SocketActions.LINK_DEVICE,
        message: ErrorMessages.NETWORK_SETUP_FAILED,
        community: payload.id,
      })
      return
    }
    const communities = (await this.localDbService.getCommunities()) ?? {}
    if (Object.keys(communities).length > 0) {
      emitError(this.serverIoProvider.io, {
        type: SocketActions.LINK_DEVICE,
        message: ErrorMessages.COMMUNITY_ALREADY_INITIALIZED,
        community: payload.id,
      })
      return
    }

    await this.erasePreviousCommunityArtifacts()
    const { seed, teamId, userId, userName } = inviteData.authData
    await this.sigChainService.createChainFromDeviceInvite(
      { seed, userName, deviceName: payload.deviceName, expectedTeamId: teamId, expectedUserId: userId },
      teamId,
      true
    )

    const { community, identity } = await this.bootstrapCommunityFromInvitation(payload.id, inviteData, userId)
    this.ensurePendingAdmissionAttempt(community.id, 'device')
    return { id: community.id, community, identity }
  }

  private ensurePendingAdmissionAttempt(
    communityId: string,
    invitationType: InvitationAdmissionType
  ): PendingAdmissionAttempt {
    const existing = this.pendingAdmissionAttempt
    if (existing?.communityId === communityId && existing.invitationType === invitationType) return existing

    if (existing) clearTimeout(existing.timer)
    this.writeAdmissionInProgressMarker({ communityId, invitationType })
    const generation = ++this.admissionGeneration
    const attempt: PendingAdmissionAttempt = {
      communityId,
      invitationType,
      deadline: Date.now() + INVITATION_ADMISSION_TIMEOUT_MS,
      generation,
      timer: setTimeout(() => {
        void this.timeoutPendingAdmission(attempt).catch(error => {
          this.logger.error(`Failed to close transports after admission timeout`, error)
          const timeoutError = new AdmissionError('timeout', `Admission for ${communityId} timed out`, error)
          attempt.pendingError = timeoutError
          attempt.readyToReject = true
          if (attempt.reject) {
            attempt.reject(timeoutError)
          } else {
            this.emitAdmissionTimeout(attempt)
          }
        })
      }, INVITATION_ADMISSION_TIMEOUT_MS),
      invalidated: false,
    }
    this.pendingAdmissionAttempt = attempt
    this.logger.info(`Started pending ${invitationType} admission for ${communityId}; deadline ${attempt.deadline}`)
    return attempt
  }

  private isPendingAdmissionCurrent(attempt: PendingAdmissionAttempt): boolean {
    return (
      this.pendingAdmissionAttempt === attempt &&
      !attempt.invalidated &&
      this.admissionGeneration === attempt.generation
    )
  }

  private invalidatePendingAdmission(attempt: PendingAdmissionAttempt, error?: Error): void {
    if (attempt.invalidated) return
    attempt.invalidated = true
    clearTimeout(attempt.timer)
    ++this.admissionGeneration
    attempt.cleanup?.()
    if (error) attempt.reject?.(error)
  }

  private async timeoutPendingAdmission(attempt: PendingAdmissionAttempt): Promise<void> {
    if (!this.isPendingAdmissionCurrent(attempt)) return
    this.timedOutAdmissionCommunityId = attempt.communityId
    this.communityState = ServiceState.DEFAULT
    this.logger.warn(`Pending ${attempt.invitationType} admission timed out for ${attempt.communityId}`)
    const error = new AdmissionError('timeout', `Admission for ${attempt.communityId} timed out`)
    attempt.pendingError = error
    // Invalidate synchronously, then drain transports before rejecting launch. This
    // serializes timeout recovery with an explicit RESET_ADMISSION request.
    this.invalidatePendingAdmission(attempt)
    // Closing these transports prevents a late JOINED event from creating a team
    // while launchCommunity is unwinding and leaves the local socket available for
    // the recovery acknowledgement.
    attempt.closePromise = this.closeAdmissionTransports()
    await attempt.closePromise
    attempt.readyToReject = true
    if (attempt.reject) {
      attempt.reject(error)
    } else {
      this.emitAdmissionTimeout(attempt)
    }
  }

  private emitAdmissionTimeout(attempt: PendingAdmissionAttempt): void {
    if (attempt.errorEmitted) return
    attempt.errorEmitted = true
    emitError(this.serverIoProvider.io, {
      type: SocketActions.LAUNCH_COMMUNITY,
      message: ErrorMessages.ADMISSION_TIMEOUT,
      community: attempt.communityId,
    })
  }

  private async closeAdmissionTransports(): Promise<void> {
    this.qssService?.close()
    await this.libp2pService?.close(false)
  }

  private finishPendingAdmissionAttempt(attempt: PendingAdmissionAttempt): void {
    if (this.pendingAdmissionAttempt !== attempt) return
    clearTimeout(attempt.timer)
    this.pendingAdmissionAttempt = undefined
  }

  private async bootstrapCommunityFromInvitation(
    id: string,
    inviteData: DeviceInvitationData,
    userId: string
  ): Promise<{ community: Community; identity: Identity }> {
    const network = await this.getNetworkInfo()
    const identity: Identity = {
      communityId: id,
      userId,
      networkInfo: network,
      joinTimestamp: null,
      introMessageSent: true,
    }
    await this.storageService.setIdentity(identity)
    const localAddress = createLibp2pAddress(network.hiddenService.onionAddress, network.peerId.id)
    const bootstrapPeerStats: Record<string, NetworkStats> = {}
    for (const pair of inviteData.pairs) {
      bootstrapPeerStats[pair.peerId] = {
        peerId: pair.peerId,
        address: createLibp2pAddress(pair.onionAddress, pair.peerId),
        connectionTime: 0,
        lastSeen: DateTime.utc().toSeconds(),
      } as NetworkStats
    }
    await this.localDbService.updatePeerStats(bootstrapPeerStats)
    const community: Community = {
      id,
      name: inviteData.authData.communityName,
      peerList: [...new Set([localAddress, ...Object.keys(bootstrapPeerStats)])],
      inviteData,
      psk: inviteData.psk,
      teamId: inviteData.authData.teamId,
      ownership: CommunityOwnership.User,
      qssEnabled: inviteData.version === InvitationDataVersion.v5 ? inviteData.qssEnabled : undefined,
      qssEndpoint: inviteData.version === InvitationDataVersion.v5 ? inviteData.qssEndpoint : undefined,
      qssSetup: inviteData.version === InvitationDataVersion.v5 ? true : undefined,
    }
    await this.localDbService.setCommunity(community)
    await this.localDbService.setCurrentCommunityId(id)
    return { community, identity }
  }

  public async launchCommunity(id: string): Promise<void> {
    const community: Community | undefined = await this.localDbService.getCommunity(id)
    if (!community) {
      this.logger.error('No community found in storage')
      emitError(this.serverIoProvider.io, {
        type: SocketActions.LAUNCH_COMMUNITY,
        message: ErrorMessages.COMMUNITY_LAUNCH_FAILED,
        community: id,
      })
      return
    }
    await this.localDbService.setCurrentCommunityId(id)
    if ([ServiceState.LAUNCHING, ServiceState.LAUNCHED].includes(this.communityState)) {
      this.logger.error(
        'Cannot launch community more than once.' +
          ' Community has already been launched or is currently being launched.'
      )
      return
    }
    this.communityState = ServiceState.LAUNCHING
    this.logger.info(`Community state is now ${this.communityState}`)

    if (community.name) {
      try {
        this.logger.info('Loading sigchain for community', community.name)
        if (this.sigChainService.activeChainTeamId !== community.teamId) {
          await this.sigChainService.loadChain(community.teamId, true)
        }
      } catch (e) {
        this.logger.warn('Failed to load sigchain', e)
        emitError(this.serverIoProvider.io, {
          type: SocketActions.LAUNCH_COMMUNITY,
          message: ErrorMessages.SIGCHAIN_LOAD_FAILED,
          community: community.id,
          trace: (e as Error).stack,
        })
        await this.localDbService.deleteCommunity(community.id)
        return
      }
    } else {
      this.logger.warn('No community name found in storage')
    }

    try {
      await this.launch(community)
    } catch (e) {
      this.logger.error(`Failed to launch community ${community.id}`, e)
      this.communityState = ServiceState.DEFAULT
      const admissionTimedOut = e instanceof AdmissionError && e.kind === 'timeout'
      const admissionInterrupted = e instanceof AdmissionError && e.kind === 'cancelled'
      if (admissionTimedOut) this.timedOutAdmissionCommunityId = community.id
      if (admissionInterrupted) this.interruptedAdmissionCommunityId = community.id
      const attempt = this.pendingAdmissionAttempt
      if (attempt?.communityId === community.id && !admissionTimedOut) {
        this.invalidatePendingAdmission(attempt)
        if (!admissionInterrupted) this.finishPendingAdmissionAttempt(attempt)
      }
      if (!(admissionTimedOut && attempt?.errorEmitted)) {
        emitError(this.serverIoProvider.io, {
          type: SocketActions.LAUNCH_COMMUNITY,
          message: admissionTimedOut
            ? ErrorMessages.ADMISSION_TIMEOUT
            : admissionInterrupted
              ? ErrorMessages.ADMISSION_INTERRUPTED
              : ErrorMessages.COMMUNITY_LAUNCH_FAILED,
          community: community.id,
          trace: (e as Error).stack,
        })
      }
      return
    }

    this.logger.info(`Launched community ${community.id}`)

    this.serverIoProvider.io.emit(SocketEvents.CONNECTION_PROCESS_INFO, ConnectionProcessInfo.COMMUNITY_LAUNCHED)

    this.communityId = community.id
    this.communityState = ServiceState.LAUNCHED

    // Unblock websocket endpoints
    this.socketService.resolveReadyness()
    this.serverIoProvider.io.emit(SocketEvents.COMMUNITY_LAUNCHED, {
      id: community.id,
    } as LaunchCommunityPayload)
  }

  public async spawnTorHiddenService(communityId: string, identity: Identity): Promise<string> {
    this.logger.info(`Registering hidden service for community ${communityId}, peer: ${identity.networkInfo.peerId.id}`)
    this.serverIoProvider.io.emit(SocketEvents.CONNECTION_PROCESS_INFO, ConnectionProcessInfo.SPAWNING_HIDDEN_SERVICE)
    this.tor.registerHiddenService({
      targetPort: this.ports.libp2pHiddenService,
      privKey: identity.networkInfo.hiddenService.privateKey,
      onionAddress: identity.networkInfo.hiddenService.onionAddress,
      virtPort: 80,
    })
    return identity.networkInfo.hiddenService.onionAddress
  }

  public async launch(community: Community) {
    this.logger.info(`Launching community ${community.id}`)

    const activeChain = this.sigChainService.getActiveChain()
    const hasDurableAdmission =
      activeChain.team != null &&
      !activeChain.isPendingDeviceAdmission &&
      activeChain.roles.amIMemberOfRole(RoleName.MEMBER)
    if (this.restoredAdmissionMarker?.communityId === community.id) {
      if (hasDurableAdmission) {
        this.logger.info(`Clearing stale admission marker for fully admitted community ${community.id}`)
        this.clearAdmissionInProgressMarker()
        this.interruptedAdmissionCommunityId = undefined
      } else {
        throw new AdmissionError('cancelled', `Admission for ${community.id} was interrupted`)
      }
    }
    const isInvitationAdmission = !hasDurableAdmission
    const pendingAdmissionAttempt = isInvitationAdmission
      ? this.ensurePendingAdmissionAttempt(community.id, activeChain.isPendingDeviceAdmission ? 'device' : 'community')
      : undefined

    const identity = await this.storageService.getIdentity(community.id)
    this.assertPendingAdmissionCurrent(pendingAdmissionAttempt, community.id)
    if (!identity) {
      throw new Error(ErrorMessages.IDENTITY_NOT_FOUND)
    }

    const useLocalTransport = isLocalTransportEnabled()
    const networkAddress = useLocalTransport
      ? identity.networkInfo.hiddenService.onionAddress
      : await this.spawnTorHiddenService(community.id, identity)

    if (useLocalTransport) {
      // The stored identity owns the port, so adopt it: a restart re-rolls
      // this.ports.libp2pHiddenService and the peer must keep its old address.
      const parsedLocalAddress = parseLocalAddress(networkAddress)
      if (parsedLocalAddress == null) {
        throw new Error(`Local transport requires a 127.0.0.1:<port> peer address, received: ${networkAddress}`)
      }
      this.ports = { ...this.ports, libp2pHiddenService: parsedLocalAddress.port }
    }

    const peerIdData: CreatedLibp2pPeerId = {
      peerId: peerIdFromString(identity.networkInfo.peerId.id),
      privKey: privateKeyFromRaw(uint8arrays.fromString(identity.networkInfo.peerId.privKey, 'base64')),
    }
    const localAddress = createLibp2pAddress(networkAddress, peerIdData.peerId.toString())

    const params: Libp2pNodeParams = {
      peerId: peerIdData,
      listenAddresses: [this.libp2pService.createLibp2pListenAddress(networkAddress)],
      agent: useLocalTransport ? undefined : this.socksProxyAgent,
      localAddress: localAddress,
      targetPort: this.ports.libp2pHiddenService,
      psk: generateLibp2pPSK(community.psk).fullKey,
      torBootstrap: useLocalTransport ? undefined : this.tor,
    }
    this.assertPendingAdmissionCurrent(pendingAdmissionAttempt, community.id)
    await this.libp2pService.createInstance(params)
    if (pendingAdmissionAttempt && !this.isPendingAdmissionCurrent(pendingAdmissionAttempt)) {
      // The timeout may have closed transports before createInstance published
      // its node. Close the late node as well so reset cannot be undone by this
      // continuation.
      await this.closeAdmissionTransports()
      throw (
        pendingAdmissionAttempt.pendingError ??
        new AdmissionError('cancelled', `Admission for ${community.id} was interrupted`)
      )
    }

    let storageTeamId: string | undefined
    let setupStorageWithTeamMetaPromise: Promise<void> | undefined
    const setupStorageWithTeamMeta = async (teamId: string) => {
      if (pendingAdmissionAttempt && !this.isPendingAdmissionCurrent(pendingAdmissionAttempt)) return
      if (storageTeamId != null && storageTeamId !== teamId) {
        throw new Error(`Storage metadata team mismatch: ${storageTeamId} !== ${teamId}`)
      }
      storageTeamId = teamId

      if (setupStorageWithTeamMetaPromise != null) {
        this.logger.info('Storage metadata setup already in progress, waiting')
        return setupStorageWithTeamMetaPromise
      }

      setupStorageWithTeamMetaPromise = (async () => {
        this.logger.info('Setting up storage')
        await this.storageService.init(teamId)
        if (pendingAdmissionAttempt && !this.isPendingAdmissionCurrent(pendingAdmissionAttempt)) return
        this.qssService.markTeamStorageReady(teamId)
      })()

      return setupStorageWithTeamMetaPromise
    }

    if (hasDurableAdmission) {
      this.logger.debug('Active chain already has team and user is a member, setting up storage immediately')
      await setupStorageWithTeamMeta(activeChain.team!.id)
      this.qssService.connect(community.qssEndpoint)
      await this._updateTeamIdOnStoredCommunity(community, activeChain)
    } else {
      this.logger.debug(
        'Active chain does not have team or user is not a member, waiting for team metadata before setting up storage'
      )
      const storageReadyPromise = new Promise<void>((resolve, reject) => {
        let settled = false
        let joinedViaQss = false

        const cleanup = () => {
          this.qssService.off(QSSEvents.QSS_FULLY_JOINED, handleQssFullyJoined)
          this.qssService.off(QSSEvents.QSS_AUTH_ERROR, handleQssAuthError)
          this.libp2pService.off(Libp2pEvents.AUTH_JOINED, handleLibp2pAuthJoined)
          this.sigChainService.off(SigchainEvents.DEVICE_ADMITTED, handleDeviceAdmitted)
          if (pendingAdmissionAttempt?.cleanup === cleanup) pendingAdmissionAttempt.cleanup = undefined
        }

        const rejectLaunch = (error: unknown) => {
          if (settled) return
          settled = true
          cleanup()
          reject(error instanceof Error ? error : new Error(String(error)))
        }

        if (pendingAdmissionAttempt) {
          pendingAdmissionAttempt.reject = error => rejectLaunch(error)
          pendingAdmissionAttempt.cleanup = cleanup
        }

        const handleStorageReady = async (teamId: string, joinedVia: 'qss' | 'libp2p' | 'device') => {
          if (settled) return
          if (pendingAdmissionAttempt && !this.isPendingAdmissionCurrent(pendingAdmissionAttempt)) return
          try {
            await setupStorageWithTeamMeta(teamId)
            if (pendingAdmissionAttempt && !this.isPendingAdmissionCurrent(pendingAdmissionAttempt)) return
            await this._updateTeamIdOnStoredCommunity(community, teamId)
            if (pendingAdmissionAttempt && !this.isPendingAdmissionCurrent(pendingAdmissionAttempt)) return
            if (joinedVia !== 'qss' && !joinedViaQss) {
              // The QSS sign-in that ran before this join completed had no team to work
              // with, so the native push prerequisites were deferred. The QSS path
              // re-emits them from _handleSelfAssignMember before QSS_FULLY_JOINED; a
              // join that completed over libp2p never passes through there, so do it
              // here unless the QSS path has already done it (#346).
              await this.qssService.syncNativePushPrerequisites(
                teamId,
                this.sigChainService.getActiveChain(),
                `${joinedVia} join completed`
              )
            }
            if (pendingAdmissionAttempt && !this.isPendingAdmissionCurrent(pendingAdmissionAttempt)) return
            if (settled) return
            settled = true
            cleanup()
            resolve()
          } catch (e) {
            rejectLaunch(e)
          }
        }

        const handleQssFullyJoined = (teamId: string) => {
          if (pendingAdmissionAttempt && !this.isPendingAdmissionCurrent(pendingAdmissionAttempt)) return
          this.logger.info(`Handling ${QSSEvents.QSS_FULLY_JOINED} event`, teamId)
          joinedViaQss = true
          void handleStorageReady(teamId, 'qss')
        }
        const handleLibp2pAuthJoined = (payload: { peer: string }) => {
          if (pendingAdmissionAttempt && !this.isPendingAdmissionCurrent(pendingAdmissionAttempt)) return
          this.logger.info(`Handling ${Libp2pEvents.AUTH_JOINED} event`, payload)
          const teamId = this.sigChainService.getActiveChain().team?.id
          if (teamId == null) {
            rejectLaunch(
              new Error(`Cannot initialize storage after ${Libp2pEvents.AUTH_JOINED}; active chain has no team`)
            )
            return
          }
          void handleStorageReady(teamId, 'libp2p')
        }
        const handleDeviceAdmitted = (teamId: string) => {
          if (pendingAdmissionAttempt && !this.isPendingAdmissionCurrent(pendingAdmissionAttempt)) return
          if (teamId !== community.teamId) return
          this.logger.info(`Handling ${SigchainEvents.DEVICE_ADMITTED} event`, teamId)
          void handleStorageReady(teamId, 'device')
        }
        const handleQssAuthError = ({ teamId, error }: QSSAuthErrorPayload) => {
          if (pendingAdmissionAttempt && !this.isPendingAdmissionCurrent(pendingAdmissionAttempt)) return
          if (teamId !== community.teamId) return
          this.logger.error(`Handling ${QSSEvents.QSS_AUTH_ERROR} event`, teamId, error)
          rejectLaunch(
            pendingAdmissionAttempt
              ? new AdmissionError('cancelled', `Admission for ${community.id} was interrupted`, error)
              : error
          )
        }

        this.qssService.once(QSSEvents.QSS_FULLY_JOINED, handleQssFullyJoined)
        this.qssService.on(QSSEvents.QSS_AUTH_ERROR, handleQssAuthError)
        this.libp2pService.once(Libp2pEvents.AUTH_JOINED, handleLibp2pAuthJoined)
        this.sigChainService.on(SigchainEvents.DEVICE_ADMITTED, handleDeviceAdmitted)

        // The deadline can expire while createInstance is still starting. Check
        // only after listeners exist so rejectLaunch can remove all of them.
        if (pendingAdmissionAttempt?.readyToReject && pendingAdmissionAttempt.pendingError) {
          rejectLaunch(pendingAdmissionAttempt.pendingError)
        }
      })

      if (!pendingAdmissionAttempt || this.isPendingAdmissionCurrent(pendingAdmissionAttempt)) {
        this.qssService.connect(community.qssEndpoint)
      }

      if (this.tor.bootstrapped) {
        this.serverIoProvider.io.emit(SocketEvents.TOR_INITIALIZED)
      }
      this.serverIoProvider.io.emit(SocketEvents.CONNECTION_PROCESS_INFO, ConnectionProcessInfo.CONNECTING_TO_COMMUNITY)

      await storageReadyPromise
    }

    if (pendingAdmissionAttempt) {
      this.finishPendingAdmissionAttempt(pendingAdmissionAttempt)
      this.clearAdmissionInProgressMarker()
    }

    if (this.tor.bootstrapped) {
      this.serverIoProvider.io.emit(SocketEvents.TOR_INITIALIZED)
    }

    this.logger.info('Storage initialized')
    this.serverIoProvider.io.emit(SocketEvents.CONNECTION_PROCESS_INFO, ConnectionProcessInfo.CONNECTING_TO_COMMUNITY)
  }

  private assertPendingAdmissionCurrent(attempt: PendingAdmissionAttempt | undefined, communityId: string): void {
    if (!attempt || this.isPendingAdmissionCurrent(attempt)) return
    throw attempt.pendingError ?? new AdmissionError('cancelled', `Admission for ${communityId} was interrupted`)
  }

  private async _updateTeamIdOnStoredCommunity(community: Community, chain: SigChain): Promise<void>
  private async _updateTeamIdOnStoredCommunity(community: Community, teamId: string): Promise<void>
  private async _updateTeamIdOnStoredCommunity(community: Community, chainOrTeamId: SigChain | string): Promise<void> {
    if (community.teamId != null) return
    if (chainOrTeamId instanceof SigChain && chainOrTeamId.team == null) {
      this.logger.warn(`Can't update team ID on stored community ${community.id} because sigchain has nullish team`)
      return
    }
    this.logger.debug(`Updating team ID for stored community ${community.id}`)
    const teamId = chainOrTeamId instanceof SigChain ? chainOrTeamId.team!.id : chainOrTeamId
    await this.localDbService.setCommunity({ ...community, teamId })
    const payload: UpdateCommunityPayload = {
      id: community.id,
      updates: {
        teamId,
      },
    }
    this.serverIoProvider.io.emit(SocketEvents.COMMUNITY_UPDATED, payload)
  }

  /**
   * Update user and channel metadata in the frontend when the sigchain/DBs are updated
   *
   * @param sourceEvent The emitted event whose handler triggered the update
   * @param teamId ID of the sigchain that was updated
   */
  public async updateUserChannelMetadataInFrontend(sourceEvent: string, teamId: string): Promise<void> {
    this.logger.debug('Updating user/channel metadata in frontend', sourceEvent, teamId)
    if (!this.sigChainService) {
      this.logger.warn(`Skipping frontend metadata update, sigchainservice hasn't been initialized`)
      return
    }

    let sigChain: SigChain
    try {
      sigChain = this.sigChainService.getChain(teamId, true)
    } catch (e) {
      this.logger.error(`No sigchain found for team ID ${teamId}, skipping frontend metadata update`, e)
      return
    }

    try {
      await this._updateUsersInStateManager(sourceEvent, teamId, sigChain)
    } catch (e) {
      this.logger.error('Error while updating user metadata in frontend', e)
    }

    try {
      await this._updateChannelMetadataInNativeMobile(sourceEvent, teamId, sigChain)
    } catch (e) {
      this.logger.error('Error while updating channel metadata in mobile', e)
    }
  }

  /**
   * Update user records in the state manager based on sigchain user data and private channel metadata (to get channel membership)
   *
   * @param sourceEvent The emitted event whose handler triggered the update
   * @param teamId ID of the sigchain that was updated
   * @param sigChain Sigchain that was updated
   */
  private async _updateUsersInStateManager(sourceEvent: string, teamId: string, sigChain: SigChain): Promise<void> {
    this.logger.debug('Updating users after source event', sourceEvent, teamId)
    let channelMapping: PrivateChannelMappings = {
      roleNameToChannel: {},
      idToRoleName: {},
    }
    if (!this.storageService || !this.storageService.initialized || !this.storageService.channels.initialized) {
      this.logger.warn(`StorageService hasn't been initialized, skipping channel mappings...`)
    } else {
      channelMapping = await this.storageService.channels.getPrivateChannelsByRolename()
    }

    const _handleUser = (member: Member, sigChain: SigChain): User => {
      const privateChannelIds: string[] =
        channelMapping != null
          ? member.roles
              .filter(roleName => roleName in channelMapping.roleNameToChannel)
              .map(roleName => channelMapping.roleNameToChannel[roleName].id)
          : []
      if (member.userId === sigChain.user.userId) {
        const channelSpecificPermissions: PrivateChannelPermissions[] = []
        for (const channelId of privateChannelIds) {
          const roleName = channelMapping.idToRoleName[channelId]
          channelSpecificPermissions.push({
            channelId,
            addMembers: sigChain.channels.canMemberAddMembersToPrivateChannel(member.userId, roleName),
            removeMembers: sigChain.channels.canMemberRemoveMembersFromPrivateChannel(member.userId, roleName),
            delete: sigChain.channels.canMemberDeletePrivateChannel(member.userId, roleName),
          })
        }
        const payload: SetChannelPermissionsPayload = {
          genericPermissions: {
            public: {
              create: sigChain.channels.canMemberCreatePublicChannel(member.userId),
              delete: sigChain.channels.canMemberDeletePublicChannel(member.userId),
            },
            private: {
              create: sigChain.channels.canMemberCreatePrivateChannel(member.userId),
            },
          },
          channelSpecificPermissions,
        }
        this.serverIoProvider.io.emit(SocketEvents.CHANNEL_PERMISSIONS_UPDATED, payload)
      }
      return {
        userId: member.userId,
        roles: member.roles,
        channelIds: privateChannelIds,
        isRegistered: true,
        isDuplicated: false,
      }
    }

    /**
     * TODO: clean this up so we are only updating users that are actually updated
     *
     * (Can we base these updates on the graph itself vs pulling directly from the Team object?)
     */
    const users = sigChain.team?.members().map((member): User => _handleUser(member, sigChain))
    this.serverIoProvider.io.emit(SocketEvents.USERS_UPDATED, { users })
  }

  /**
   * Pass channel ID to channel name mappings to mobile for populating notifications
   *
   * @param sourceEvent The emitted event whose handler triggered the update
   * @param teamId ID of the sigchain that was updated
   * @param sigChain Sigchain that was updated
   */
  private async _updateChannelMetadataInNativeMobile(
    sourceEvent: string,
    teamId: string,
    sigChain: SigChain
  ): Promise<void> {
    const platform = process.platform as string
    if (platform !== 'android' && platform !== 'ios') {
      this.logger.trace('Skipping channel metadata mobile update because this is not a mobile client', platform)
      return
    }
    this.logger.debug('Updating mobile channel metadata after source event', sourceEvent, teamId, platform)

    // handle chain updates
    if (!this.storageService || !this.storageService.initialized || !this.storageService.channels.initialized) {
      this.logger.warn(`StorageService or channels haven't been initialized, skipping channel metadata update...`)
      return
    }

    const channels = await this.storageService.channels.getChannels()
    const channelMetadataForMobile: MobileChannelMetadata[] = channels.map(channel => ({
      channelName: channel.name,
      channelId: channel.id,
    }))
    const payload: MobileChannelMetadataUpdatedPayload = {
      teamId,
      channelMetadata: channelMetadataForMobile,
    }
    this.serverIoProvider.io.emit(SocketEvents.MOBILE_CHANNEL_METADATA_UPDATED, payload)
  }

  /**
   * Attaches listeners for events received from the Tor service
   */
  private attachTorEventsListeners() {
    this.logger.info('attachTorEventsListeners')

    this.tor.on(SocketEvents.CONNECTION_PROCESS_INFO, data => {
      this.serverIoProvider.io.emit(SocketEvents.CONNECTION_PROCESS_INFO, data)
    })
    this.socketService.on(SocketEvents.CONNECTION_PROCESS_INFO, data => {
      this.serverIoProvider.io.emit(SocketEvents.CONNECTION_PROCESS_INFO, data)
    })
  }

  /**
   * Attaches listeners for events received from the state manager
   */
  private attachSocketServiceListeners() {
    // Community
    this.socketService.on(SocketActions.CONNECTION, () => {
      this.logger.info(`socketService - ${SocketActions.CONNECTION}`)
    })

    this.socketService.on(SocketActions.LAUNCH_COMMUNITY, (args: LaunchCommunityPayload) => {
      this.logger.info(`socketService - ${SocketActions.LAUNCH_COMMUNITY}`)
      this.launchCommunity(args.id)
    })

    this.socketService.on(
      SocketActions.CREATE_COMMUNITY,
      async (args: InitCommunityPayload, callback: (response: ResponseCreateCommunityPayload | undefined) => void) => {
        this.logger.info(`socketService - ${SocketActions.CREATE_COMMUNITY}`)
        try {
          callback(await this.createCommunity(args))
        } catch (e) {
          this.logger.error('Error while handling create community request', e)
          callback(undefined)
        }
      }
    )
    this.socketService.on(
      SocketActions.JOIN_COMMUNITY,
      async (args: InitCommunityPayload, callback: (response: ResponseJoinCommunityPayload | undefined) => void) => {
        this.logger.info(`socketService - ${SocketActions.JOIN_COMMUNITY}`)
        try {
          callback(await this.joinCommunity(args))
        } catch (e) {
          this.logger.error('Error while handling join community request', e)
          callback(undefined)
        }
      }
    )
    this.socketService.on(
      SocketActions.LINK_DEVICE,
      async (args: InitDeviceLinkPayload, callback: (response?: ResponseLinkDevicePayload) => void) => {
        try {
          callback(await this.linkDevice(args))
        } catch (e) {
          this.logger.error('Error while handling link device request', e)
          callback(undefined)
        }
      }
    )

    this.socketService.on(
      SocketActions.RESET_ADMISSION,
      async ({ id }: LaunchCommunityPayload, callback: (success: boolean) => void) => {
        try {
          callback(await this.resetAdmission(id))
        } catch (error) {
          this.logger.error('Failed to reset admission', error)
          callback(false)
        }
      }
    )

    this.socketService.on(SocketActions.LEAVE_COMMUNITY, async (callback: (closed: boolean) => void) => {
      this.logger.info(`socketService - ${SocketActions.LEAVE_COMMUNITY}`)
      try {
        callback(await this.leaveCommunity())
      } catch (e) {
        this.logger.error('Error while handling leave community request', e)
        callback(false)
      }
    })

    // Local First Auth

    this.socketService.on(
      SocketActions.VALIDATE_OR_CREATE_LONG_LIVED_LFA_INVITE,
      async (args: RequestInvitePayload, callback: (response: ResponseInvitePayload) => void) => {
        if (this.sigChainService.activeChainTeamId == null) {
          this.logger.warn(`No sigchain configured, skipping long lived LFA invite code validation/generation!`)
          callback({ valid: false })
          return
        }

        if (args.id && this.sigChainService.getActiveChain().invites.isValidLongLivedUserInvite(args.id)) {
          callback({ valid: true })
        } else {
          try {
            const newInvite = this.sigChainService.getActiveChain().invites.createLongLivedUserInvite()
            await this.sigChainService.saveChain(this.sigChainService.activeChainTeamId)
            this.serverIoProvider.io.emit(SocketEvents.CREATED_LONG_LIVED_LFA_INVITE, newInvite)
            callback({ valid: false, newInvite })
          } catch (e) {
            e instanceof PermissionsError
              ? this.logger.info(e.message)
              : this.logger.error(`Failed to generate a new long lived LFA invite code!`, e)
            callback({ valid: false })
          }
        }
      }
    )
    this.socketService.on(
      SocketActions.CREATE_DEVICE_LINK,
      async (_args: RequestDeviceLinkPayload, callback: (response?: DeviceLinkInvite) => void) => {
        const teamId = this.sigChainService.activeChainTeamId
        if (teamId == null) return callback(undefined)
        try {
          const invite = this.sigChainService.getActiveChain().invites.createDeviceInvite()
          await this.sigChainService.saveChain(teamId)
          callback(invite)
        } catch (e) {
          this.logger.error('Failed to generate a device link', e)
          callback(undefined)
        }
      }
    )

    // Public Channels

    this.socketService.on(
      SocketActions.CREATE_CHANNEL,
      async (payload: CreateChannelPayload, callback: (response?: CreateChannelResponse) => void) => {
        const _createChannel = async (payload: CreateChannelPayload): Promise<CreateChannelResponse> => {
          try {
            return await this.storageService?.channels.handleCreateChannel(payload)
          } catch (e) {
            this.logger.error('Error while creating channel', e)
            return {
              status: ChannelOperationStatus.FAILED,
            }
          }
        }
        callback(await _createChannel(payload))
      }
    )
    this.socketService.on(
      SocketActions.DELETE_CHANNEL,
      async (payload: DeleteChannelPayload, callback: (response: DeleteChannelResponse) => void) => {
        callback(await this.storageService?.channels.deleteChannel(payload))
      }
    )
    this.socketService.on(
      SocketActions.DELETE_FILES_FROM_CHANNEL,
      async (payload: DeleteFilesFromChannelSocketPayload) => {
        this.logger.info(`socketService - ${SocketActions.DELETE_FILES_FROM_CHANNEL}`)
        await this.storageService?.channels.deleteFilesFromChannel(payload)
        // await this.deleteFilesFromTemporaryDir() //crashes on mobile, will be fixes in next versions
      }
    )
    this.socketService.on(SocketActions.SEND_MESSAGE, async (args: ChannelMessage) => {
      await this.storageService?.channels.sendMessage(args)
    })

    this.socketService.on(
      SocketActions.GET_MESSAGES,
      async (payload: GetMessagesPayload, callback: (response?: MessagesLoadedPayload) => void) => {
        callback(await this.storageService?.channels.getMessages(payload.channelId, payload.ids))
      }
    )

    // Private Channels

    this.socketService.on(
      SocketActions.ADD_MEMBERS_TO_CHANNEL,
      async (payload: AddMembersChannelPayload, callback: (response?: AddMembersChannelResponse) => void) => {
        callback(await this.storageService?.channels.addMembersToPrivateChannel(payload))
      }
    )

    // Files
    this.socketService.on(SocketActions.DOWNLOAD_FILE, async (payload: DownloadFilePayload) => {
      await this.storageService?.channels.downloadFile(payload.metadata)
    })
    this.socketService.on(SocketActions.ATTACH_FILE, async (metadata: FileMetadata) => {
      await this.storageService?.channels.attachFile(metadata)
    })
    this.socketService.on(SocketEvents.FILE_ATTACHED, async (args: FileMetadata) => {
      await this.storageService?.channels.attachFile(args)
    })
    this.socketService.on(SocketActions.CANCEL_DOWNLOAD, mid => {
      this.storageService?.channels.cancelDownload(mid)
    })

    // System
    this.socketService.on(SocketActions.CLOSE, async () => {
      await this.closeAllServices()
    })

    // User Profile
    this.socketService.on(
      SocketActions.SET_USER_PROFILE,
      async (payload: SetUserProfilePayload, callback: (response: SetUserProfileResponse) => void) => {
        callback(await this.storageService?.addUserProfile(payload.profile))
      }
    )

    this.socketService.on(SocketActions.USER_PROFILES_UPDATED, (payload: UserProfilesUpdatedPayload) => {
      this.logger.info(`Forwarding ${SocketActions.USER_PROFILES_UPDATED} back to state manager`)
      this.serverIoProvider.io.emit(SocketEvents.USER_PROFILES_UPDATED, payload)
    })

    this.socketService.on(SocketActions.TOGGLE_P2P, async (payload: boolean, callback: (response: boolean) => void) => {
      try {
        if (payload) {
          await this.libp2pService.resume()
          await this.storageService.startSync()
        } else {
          await this.libp2pService.pause()
          await this.storageService.stopSync()
        }
      } catch (e) {
        this.logger.error('Error toggling libp2p service', e)
      }

      if (this.libp2pService.state === Libp2pState.Started) {
        callback(true)
      } else {
        callback(false)
      }
    })
  }

  /**
   * Handle events from the sigchain service and update data in the state manager
   */
  private attachSigchainListeners() {
    if (!this.sigChainService) return

    this.sigChainService.on(SigchainEvents.UPDATED, async (teamId: string) => {
      await this.updateUserChannelMetadataInFrontend(SigchainEvents.UPDATED, teamId)
    })
  }

  /**
   * Forwards events from the storage service to the the state manager
   * (also applies some side effects)
   */
  private attachStorageListeners() {
    if (!this.storageService) return

    this.storageService.on(StorageEvents.INITIALIZED, async () => {
      this.logger.info(`Storage - ${StorageEvents.INITIALIZED}`)
      try {
        const activeChain = this.sigChainService.activeChain
        await this.updateUserChannelMetadataInFrontend(StorageEvents.INITIALIZED, activeChain.team!.id)
      } catch (e) {
        this.logger.warn(
          `Couldn't update state manager users based on sigchain after storage init, active sigchain likely not found`,
          e
        )
      }
    })

    // Channel and Message Events
    this.storageService.channels.on(StorageEvents.CHANNELS_STORED, async (payload: ChannelsReplicatedPayload) => {
      this.logger.info(`Storage - ${StorageEvents.CHANNELS_STORED}`)
      this.serverIoProvider.io.emit(SocketEvents.CHANNELS_STORED, payload)
      this.logger.info(`Storage (emitted) - ${SocketEvents.CHANNELS_STORED}`)
      try {
        const activeChain = this.sigChainService.activeChain
        await this.updateUserChannelMetadataInFrontend(StorageEvents.CHANNELS_STORED, activeChain.team!.id)
      } catch (e) {
        this.logger.warn(
          `Couldn't update state manager users based on sigchain after channels stored, active sigchain likely not found`,
          e
        )
      }
    })
    this.storageService.channels.on(StorageEvents.MESSAGES_STORED, (payload: MessagesLoadedPayload) => {
      this.serverIoProvider.io.emit(SocketEvents.MESSAGES_STORED, payload)
    })
    this.storageService.channels.on(StorageEvents.MESSAGE_IDS_STORED, (payload: ChannelMessageIdsResponse) => {
      if (payload.ids.length === 0) {
        return
      }
      this.serverIoProvider.io.emit(SocketEvents.MESSAGE_IDS_STORED, payload)
    })
    this.storageService.channels.on(StorageEvents.CHANNEL_SUBSCRIBED, (payload: ChannelSubscribedPayload) => {
      this.logger.info(`Storage - ${StorageEvents.CHANNEL_SUBSCRIBED}`, payload)
      this.serverIoProvider.io.emit(SocketEvents.CHANNEL_SUBSCRIBED, payload)
      this.logger.info(`Storage (emitted) - ${SocketEvents.CHANNEL_SUBSCRIBED}`)
    })
    this.storageService.channels.on(StorageEvents.REMOVE_DOWNLOAD_STATUS, (payload: RemoveDownloadStatus) => {
      this.serverIoProvider.io.emit(SocketEvents.REMOVE_DOWNLOAD_STATUS, payload)
    })
    this.storageService.channels.on(StorageEvents.FILE_ATTACHED, (payload: AttachFilePayload) => {
      this.serverIoProvider.io.emit(SocketEvents.FILE_ATTACHED, payload)
    })
    this.storageService.channels.on(StorageEvents.DOWNLOAD_PROGRESS, (payload: DownloadStatus) => {
      this.serverIoProvider.io.emit(SocketEvents.DOWNLOAD_PROGRESS, payload)
    })
    this.storageService.channels.on(StorageEvents.MESSAGE_MEDIA_UPDATED, (payload: FileMetadata) => {
      this.serverIoProvider.io.emit(SocketEvents.MESSAGE_MEDIA_UPDATED, payload)
    })
    this.storageService.channels.on(StorageEvents.SEND_PUSH_NOTIFICATION, (payload: PushNotificationPayload) => {
      this.serverIoProvider.io.emit(SocketEvents.PUSH_NOTIFICATION, payload)
    })
    // Other Events
    this.storageService.on(SocketEvents.CONNECTION_PROCESS_INFO, data => {
      this.serverIoProvider.io.emit(SocketEvents.CONNECTION_PROCESS_INFO, data)
    })
    this.storageService.on(StorageEvents.USER_PROFILES_STORED, (payload: UserProfilesStoredEvent) => {
      this.storageService.updatePeerStore()
      this.libp2pService.addPeersToDialQueue()
      this.serverIoProvider.io.emit(SocketEvents.USER_PROFILES_STORED, payload)
    })
  }
}
