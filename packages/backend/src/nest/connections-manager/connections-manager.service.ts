import { CommunityLifecycle } from '../admission/community-lifecycle'
import * as uint8arrays from 'uint8arrays'
import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { EventEmitter } from 'events'
import { Mutex } from 'async-mutex'
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
  type NetworkEndpointsStoredEvent,
  Identity,
  InvitationData,
  PeerId as QuietPeerId,
  InvitationDataVersion,
  isDeviceInvitationData,
  PermissionsError,
  CommunityOwnership,
  InitCommunityPayload,
  ResponseCreateCommunityPayload,
  ResponseJoinCommunityPayload,
  ResponseLinkDevicePayload,
  InitDeviceLinkPayload,
  RequestInvitePayload,
  RequestDeviceLinkPayload,
  ResponseInvitePayload,
  DeviceLinkInvite,
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
} from '@quiet/types'
import { CONFIG_OPTIONS, QSS_ALLOWED, QSS_ENDPOINT, SERVER_IO_PROVIDER, SOCKS_PROXY_AGENT } from '../const'
import { Libp2pService, Libp2pState } from '../libp2p/libp2p.service'
import { CreatedLibp2pPeerId, Libp2pNodeParams } from '../libp2p/libp2p.types'
import { LocalDbService } from '../local-db/local-db.service'
import { LocalDBKeys } from '../local-db/local-db.types'
import { emitError } from '../socket/socket.errors'
import { SocketService } from '../socket/socket.service'
import { StorageService } from '../storage/storage.service'
import { StorageEvents } from '../storage/storage.types'
import { Tor } from '../tor/tor.service'
import { ConfigOptions, GetPorts, ServerIoProviderTypes } from '../types'
import { type AdmissionResetReceipt, ServiceState, TorInitState } from './connections-manager.types'
import { DateTime } from 'luxon'
import { createLogger } from '../common/logger'
import { peerIdFromString } from '@libp2p/peer-id'
import { privateKeyFromRaw } from '@libp2p/crypto/keys'
import { SigChainService } from '../auth/sigchain.service'
import { QSSService } from '../qss/qss.service'
import { RoleName } from '../auth/services/roles/roles'
import { QSSOperationResult } from '../qss/qss.types'
import { SigchainEvents } from '../auth/types'
import { QPSService } from '../qps/qps.service'
import { CaptchaService } from '../captcha/captcha.service'
import { SigChain } from '../auth/sigchain'
import { Member } from '@localfirst/auth'
import type { PrivateChannelMappings } from '../storage/channels/channels.types'
import { AdmissionCoordinator } from '../admission/admission-coordinator.service'
import { AdmissionError, AdmissionKind, AdmissionTransport } from '../admission/admission.types'

const DEFAULT_INVITATION_ADMISSION_TIMEOUT_MS = 300_000
const configuredE2eAdmissionTimeout = Number(process.env.INVITATION_ADMISSION_TIMEOUT_MS)
// Keep production admission timing fixed, while allowing the desktop E2E suite
// to exercise the complete timeout recovery flow without a two-minute wait.
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
  private communityLifecycle?: CommunityLifecycle
  private timedOutAdmissionCommunityId?: string
  private interruptedAdmissionCommunityId?: string
  private clearedAdmissionCommunityId?: string
  private admissionResetInFlight?: Promise<boolean>
  private admissionCleanupStartedCommunityId?: string
  private replayableAdmissionResetReceipt?: AdmissionResetReceipt
  private readonly admissionMutationMutex = new Mutex()
  private closingServices = false
  private launchGeneration = 0
  private hibernating = false
  private hibernateInFlight: Promise<void> | null = null
  private wakeInFlight: Promise<void> | null = null
  private storedCommunityInitialization: Promise<void> | undefined
  private leaveInFlight: Promise<boolean> | undefined
  private leaveFailed = false
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
    private readonly captchaService: CaptchaService,
    private readonly admissionCoordinator: AdmissionCoordinator
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
    this.socketService.markOnboardingReady()
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

  public async launchCommunityFromStorage(): Promise<void> {
    return this.admissionMutationMutex.runExclusive(() => this.launchCommunityFromStorageLocked())
  }

  private async launchCommunityFromStorageLocked(): Promise<void> {
    this.logger.info('Launching community from storage')

    this.interruptedAdmissionCommunityId ??= this.readInterruptedAdmissionMarker()

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

    const community: Community | undefined = await this.localDbService.getCurrentCommunity()
    const receipt = this.readAdmissionResetReceipt()
    if (receipt != null) {
      const conflictingCommunity = await this.findAdmissionResetReceiptConflict(receipt)
      if (conflictingCommunity != null) {
        this.logger.error('Refusing stale admission reset recovery for a different durable community', {
          receiptCommunityId: receipt.id,
          currentCommunityId: conflictingCommunity.id,
        })
      } else {
        await this.completeAdmissionResetReceiptOnStartup(receipt)
        return
      }
    }
    if (!community) {
      // Absent marker + no community = fresh install or a pending LevelDB migration where
      // CURRENT_COMMUNITY_ID hasn't been populated from the renderer's persistor yet. Don't
      // purge speculatively — that was the backwards-compatibility regression.
      this.logger.info('No community found in storage')
      this.reportInterruptedAdmission()
      return
    }

    if (community.name) {
      try {
        this.logger.info('Loading sigchain for community', community.name)
        await this.sigChainService.loadChain(community.teamId, true, community.name)
      } catch (e) {
        this.logger.error('Failed to load sigchain', e)
        const invitationType = await this.provisionalInvitationTypeAfterChainLoadFailure(community)
        if (invitationType != null) {
          this.logger.info('Cleaning interrupted invitation artifacts after sigchain load failure')
          const pendingReceipt: AdmissionResetReceipt = {
            id: community.id,
            invitationType,
            phase: 'pending',
          }
          await this.beginAdmissionResetOnStartup(pendingReceipt)
        }
        return
      }

      const chain = this.sigChainService.getActiveChain()
      const admissionCompleted = chain.team != null && chain.roles.amIMemberOfRole(RoleName.MEMBER)
      if (!admissionCompleted) {
        if (this.isProvisionalAdmission(community)) {
          this.logger.info('Cleaning admission interrupted by application restart')
          const pendingReceipt: AdmissionResetReceipt = {
            id: community.id,
            invitationType:
              community.inviteData != null && isDeviceInvitationData(community.inviteData) ? 'device' : 'community',
            phase: 'pending',
          }
          await this.beginAdmissionResetOnStartup(pendingReceipt)
          return
        }
        this.logger.error(
          'Preserving a non-provisional community whose admitted role state is incomplete',
          community.id
        )
      }
      this.interruptedAdmissionCommunityId = undefined
      this.clearInterruptedAdmissionMarker()
    } else {
      this.logger.warn('No community name found in storage')
    }

    await this.launchCommunityLocked(community.id)
  }

  public async closeSocket() {
    await this.socketService.close()
  }

  public async saveActiveChain() {
    try {
      if (this.sigChainService.getActiveChain(false)?.isPendingDeviceAdmission) {
        this.logger.info('Skipping active-chain save for pending device invitation context')
        return
      }
      await this.sigChainService.saveChain(this.sigChainService.activeChainTeamId!)
    } catch (e) {
      this.logger.info('Failed to save active chain', e)
    }
  }

  public async pause() {
    this.logger.info('Pausing!')
    const reason = new AdmissionError('cancelled', 'Admission interrupted while services paused')
    this.launchGeneration += 1
    await this.communityLifecycle?.pause(reason)
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
    this.closingServices = true
    this.logger.info('Closing services', options)
    const reason = new AdmissionError('cancelled', 'Admission interrupted while services closed')
    this.launchGeneration += 1
    await this.communityLifecycle?.drain(reason)
    this.communityLifecycle = undefined

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

    const teamId = this.sigChainService.activeChainTeamId
    if (teamId != null) {
      await this.sigChainService.deleteChain(teamId, options.deleteChainFromDisk)
    }

    if (this.localDbService) {
      this.logger.info('Closing local DB')
      await this.localDbService.close()
    }
    this.closingServices = false
  }

  public leaveCommunity(): Promise<boolean> {
    if (this.leaveInFlight) return this.leaveInFlight

    // A second leave must wait for the same teardown. Otherwise it can finish first,
    // let the user create a community, and leave the original teardown deleting it.
    this.leaveInFlight = this.admissionMutationMutex
      .runExclusive(async () => {
        this.leaveFailed = true
        const success = await this.performLeaveCommunity()
        this.leaveFailed = !success
        return success
      })
      .finally(() => {
        this.leaveInFlight = undefined
      })
    return this.leaveInFlight
  }

  private async performLeaveCommunity(): Promise<boolean> {
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

  public async resetAdmission(communityId: string): Promise<boolean> {
    return this.admissionMutationMutex.runExclusive(() => this.resetAdmissionLocked(communityId))
  }

  private async resetAdmissionLocked(communityId: string): Promise<boolean> {
    if (this.closingServices) return false
    const receipt = this.readAdmissionResetReceipt()
    if (receipt != null) {
      if (receipt.id !== communityId || this.communityState !== ServiceState.DEFAULT) return false
      return this.completeAdmissionResetReceipt(receipt)
    }
    // A lost acknowledgement must not strand the UI after cleanup already succeeded.
    if (
      communityId &&
      communityId === this.clearedAdmissionCommunityId &&
      this.communityState === ServiceState.DEFAULT
    ) {
      this.interruptedAdmissionCommunityId = undefined
      this.clearInterruptedAdmissionMarker()
      return true
    }
    if (
      !communityId ||
      (communityId !== this.timedOutAdmissionCommunityId && communityId !== this.interruptedAdmissionCommunityId) ||
      this.communityState !== ServiceState.DEFAULT
    )
      return false
    if (this.admissionResetInFlight != null) return this.admissionResetInFlight
    if (this.admissionCleanupStartedCommunityId !== communityId) {
      const community = await this.localDbService.getCommunity(communityId)
      if (community == null || !this.isProvisionalAdmission(community)) return false
      this.admissionCleanupStartedCommunityId = communityId
    }
    const reset = async () => {
      // Keep the frontend socket open: acknowledgement must follow completed cleanup.
      await this.communityLifecycle?.drain(new Error('Clearing failed invitation admission'))
      this.communityLifecycle = undefined
      const community = await this.localDbService.getCommunity(communityId)
      if (community == null || !this.isProvisionalAdmission(community)) return false
      const pendingReceipt: AdmissionResetReceipt = {
        id: communityId,
        invitationType:
          community.inviteData != null && isDeviceInvitationData(community.inviteData) ? 'device' : 'community',
        phase: 'pending',
      }
      this.writeAdmissionResetReceipt(pendingReceipt)
      return this.completeAdmissionResetReceipt(pendingReceipt)
    }
    this.admissionResetInFlight = reset()
    try {
      return await this.admissionResetInFlight
    } finally {
      this.admissionResetInFlight = undefined
    }
  }

  private isProvisionalAdmission(community: Community): boolean {
    const chain = this.sigChainService.getActiveChain(false)
    if (chain == null || this.sigChainService.activeChainTeamId !== community.teamId) return false
    // Invitation data plus an invite-only chain is the durable/local evidence that this
    // identity is provisional. A damaged established chain that merely lacks MEMBER must
    // never become eligible for destructive admission cleanup.
    return community.inviteData != null && (chain.isPendingDeviceAdmission || chain.team == null)
  }

  private async provisionalInvitationTypeAfterChainLoadFailure(
    community: Community
  ): Promise<AdmissionResetReceipt['invitationType'] | undefined> {
    if (community.inviteData == null) return undefined
    if (isDeviceInvitationData(community.inviteData)) return 'device'

    const storedChain = await this.localDbService.getSigChain(community.teamId)
    if (storedChain == null || storedChain.serializedTeam != null || storedChain.teamKeyRing != null) return undefined

    // New snapshots explicitly record this state. For snapshots written before the
    // marker existed, require the exact pending shape plus the durable interruption
    // marker written when the provisional launch was cancelled.
    if (storedChain.pendingMemberAdmission !== true && this.interruptedAdmissionCommunityId !== community.id)
      return undefined
    return 'community'
  }

  private async scrubStoredInvitation(community: Community): Promise<void> {
    if (community.inviteData == null) return
    await this.localDbService.updateCommunity(community.id, { inviteData: null })
    community.inviteData = null
    this.serverIoProvider.io.emit(SocketEvents.COMMUNITY_UPDATED, {
      id: community.id,
      updates: { inviteData: null },
    } as UpdateCommunityPayload)
  }

  private static readonly LEAVE_IN_PROGRESS_MARKER = '.leave-in-progress'
  private static readonly INTERRUPTED_ADMISSION_MARKER = '.admission-interrupted'
  private static readonly ADMISSION_RESET_RECEIPT = '.admission-reset-receipt.json'

  private leaveInProgressMarkerPath(): string {
    return path.join(this.storageService.quietDir, ConnectionsManagerService.LEAVE_IN_PROGRESS_MARKER)
  }

  private interruptedAdmissionMarkerPath(): string {
    return path.join(path.dirname(this.storageService.quietDir), ConnectionsManagerService.INTERRUPTED_ADMISSION_MARKER)
  }

  private admissionResetReceiptPath(): string {
    return path.join(path.dirname(this.storageService.quietDir), ConnectionsManagerService.ADMISSION_RESET_RECEIPT)
  }

  private readAdmissionResetReceipt(): AdmissionResetReceipt | undefined {
    let encoded: string
    try {
      encoded = fs.readFileSync(this.admissionResetReceiptPath(), 'utf8')
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined
      throw error
    }

    const receipt = JSON.parse(encoded) as Partial<AdmissionResetReceipt>
    if (
      typeof receipt.id !== 'string' ||
      receipt.id.length === 0 ||
      !['device', 'community'].includes(receipt.invitationType ?? '') ||
      !['pending', 'complete'].includes(receipt.phase ?? '')
    ) {
      throw new Error('Invalid admission reset receipt')
    }
    return receipt as AdmissionResetReceipt
  }

  private writeAdmissionResetReceipt(receipt: AdmissionResetReceipt): void {
    const receiptPath = this.admissionResetReceiptPath()
    const temporaryPath = `${receiptPath}.${process.pid}.${randomUUID()}.tmp`
    fs.mkdirSync(path.dirname(receiptPath), { recursive: true })
    let descriptor: number | undefined
    try {
      descriptor = fs.openSync(temporaryPath, 'w', 0o600)
      fs.writeFileSync(descriptor, JSON.stringify(receipt), 'utf8')
      fs.fsyncSync(descriptor)
      fs.closeSync(descriptor)
      descriptor = undefined
      fs.renameSync(temporaryPath, receiptPath)
    } catch (error) {
      if (descriptor != null) fs.closeSync(descriptor)
      try {
        fs.unlinkSync(temporaryPath)
      } catch {
        // A failed write or successful rename can leave no temporary file.
      }
      throw error
    }
  }

  private clearAdmissionResetReceipt(): void {
    try {
      fs.unlinkSync(this.admissionResetReceiptPath())
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    }
  }

  private rememberCompletedAdmissionReset(receipt: AdmissionResetReceipt): void {
    this.replayableAdmissionResetReceipt = { ...receipt, phase: 'complete' }
  }

  private applyCompletedAdmissionReset(receipt: AdmissionResetReceipt): void {
    this.timedOutAdmissionCommunityId = undefined
    this.interruptedAdmissionCommunityId = undefined
    this.clearedAdmissionCommunityId = receipt.id
    this.admissionCleanupStartedCommunityId = undefined
    this.clearInterruptedAdmissionMarker()
    this.rememberCompletedAdmissionReset(receipt)
  }

  private reportCompletedAdmissionReset(): void {
    const receipt = this.replayableAdmissionResetReceipt
    if (receipt == null) return
    this.serverIoProvider.io.emit(SocketEvents.ADMISSION_RESET_COMPLETE, {
      id: receipt.id,
      invitationType: receipt.invitationType,
    })
  }

  private async beginAdmissionResetOnStartup(receipt: AdmissionResetReceipt): Promise<void> {
    try {
      this.writeAdmissionResetReceipt(receipt)
      const completed = await this.completeAdmissionResetReceipt(receipt)
      if (completed) this.reportCompletedAdmissionReset()
    } catch (error) {
      this.interruptedAdmissionCommunityId = receipt.id
      this.reportInterruptedAdmission()
      throw error
    }
  }

  private async completeAdmissionResetReceiptOnStartup(receipt: AdmissionResetReceipt): Promise<void> {
    try {
      const completed = await this.completeAdmissionResetReceipt(receipt)
      if (!completed) return
      this.reportCompletedAdmissionReset()
    } catch (error) {
      this.interruptedAdmissionCommunityId = receipt.id
      this.reportInterruptedAdmission()
      throw error
    }
  }

  private async findAdmissionResetReceiptConflict(receipt: AdmissionResetReceipt): Promise<Community | undefined> {
    const currentCommunity = await this.localDbService.getCurrentCommunity()
    if (currentCommunity != null && currentCommunity.id !== receipt.id) return currentCommunity
    const communities = (await this.localDbService.getCommunities()) ?? {}
    return Object.values(communities).find(community => community.id !== receipt.id)
  }

  private async admissionResetTargetStillStored(receipt: AdmissionResetReceipt): Promise<boolean> {
    const currentCommunity = await this.localDbService.getCurrentCommunity()
    if (currentCommunity?.id === receipt.id) return true
    const communities = (await this.localDbService.getCommunities()) ?? {}
    return Object.values(communities).some(community => community.id === receipt.id)
  }

  private async completeAdmissionResetReceipt(receipt: AdmissionResetReceipt): Promise<boolean> {
    const conflictingCommunity = await this.findAdmissionResetReceiptConflict(receipt)
    if (conflictingCommunity != null) {
      this.logger.error('Refusing admission reset receipt for a different durable community', {
        receiptCommunityId: receipt.id,
        currentCommunityId: conflictingCommunity.id,
      })
      return false
    }

    const targetStillStored = await this.admissionResetTargetStillStored(receipt)
    if (receipt.phase === 'complete' && !targetStillStored) {
      this.applyCompletedAdmissionReset(receipt)
      return true
    }

    if (receipt.phase === 'pending' || targetStillStored) {
      this.launchGeneration += 1
      this.qssService.close()
      this.captchaService.reset()
      await this.erasePreviousCommunityArtifacts()
      await this.qssService.resume()
    }

    const completedReceipt: AdmissionResetReceipt = { ...receipt, phase: 'complete' }
    this.writeAdmissionResetReceipt(completedReceipt)
    this.applyCompletedAdmissionReset(completedReceipt)
    return true
  }

  private writeInterruptedAdmissionMarker(communityId: string): void {
    try {
      fs.mkdirSync(path.dirname(this.interruptedAdmissionMarkerPath()), { recursive: true })
      fs.writeFileSync(this.interruptedAdmissionMarkerPath(), communityId)
    } catch (e) {
      this.logger.warn('Failed to write interrupted-admission marker', e)
    }
  }

  private readInterruptedAdmissionMarker(): string | undefined {
    try {
      const communityId = fs.readFileSync(this.interruptedAdmissionMarkerPath(), 'utf8').trim()
      return communityId || undefined
    } catch {
      return undefined
    }
  }

  private clearInterruptedAdmissionMarker(): void {
    try {
      fs.unlinkSync(this.interruptedAdmissionMarkerPath())
    } catch {
      // Marker is absent after ordinary admissions and after a previous successful reset.
    }
  }

  private reportInterruptedAdmission(): void {
    if (this.interruptedAdmissionCommunityId == null) return
    emitError(this.serverIoProvider.io, {
      type: SocketActions.LAUNCH_COMMUNITY,
      message: ErrorMessages.ADMISSION_INTERRUPTED,
      community: this.interruptedAdmissionCommunityId,
    })
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

  /**
   * Mint the onion address and key this identity will be known by.
   *
   * The service itself is discarded on the next line - the one that carries traffic
   * is created by spawnTorHiddenService when the community launches. So there is
   * nothing to publish here, and waiting for a descriptor upload would put community
   * creation behind a fully bootstrapped Tor for no gain.
   */
  private async createEphemeralHiddenService(): Promise<NetworkInfo['hiddenService']> {
    this.logger.info('Creating hidden service')
    const hiddenService = await this.tor.createNewHiddenService({
      targetPort: this.ports.libp2pHiddenService,
      waitForDescriptorUpload: false,
    })
    await this.tor.destroyHiddenService(hiddenService.onionAddress.split('.')[0])
    return hiddenService
  }

  private async bootstrapCommunityFromInvitation(
    id: string,
    inviteData: InvitationData,
    userId: string
  ): Promise<{ community: Community; identity: Identity }> {
    const network = await this.getNetworkInfo()
    const identity: Identity = {
      communityId: id,
      userId,
      networkInfo: network,
      joinTimestamp: null,
      introMessageSent: isDeviceInvitationData(inviteData) ? true : undefined,
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
      qssSetup:
        isDeviceInvitationData(inviteData) && inviteData.version === InvitationDataVersion.v5 ? true : undefined,
    }

    await this.localDbService.setCommunity(community)
    await this.localDbService.setCurrentCommunityId(community.id)
    return { community, identity }
  }

  public createCommunity(payload: InitCommunityPayload): Promise<ResponseCreateCommunityPayload | undefined> {
    return this.admissionMutationMutex.runExclusive(() => {
      this.requireCompletedLeave()
      return this.createCommunityLocked(payload)
    })
  }

  private requireCompletedLeave(): void {
    if (this.leaveFailed) {
      throw new Error('Community cleanup failed; retry leaving before creating or joining a community')
    }
  }

  private async createCommunityLocked(
    payload: InitCommunityPayload
  ): Promise<ResponseCreateCommunityPayload | undefined> {
    this.logger.info('Creating community', payload.id)
    if (!(await this.prepareForNewAdmission())) return
    if (await this.rejectWhenCommunityExists(SocketActions.CREATE_COMMUNITY, payload.id)) return
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

    await this.launchCommunityLocked(community.id)

    const userProfile: UserProfile = {
      userId: identity.userId,
      nickname: payload.username,
    }
    this.storageService.addUserProfile(userProfile)

    return {
      id: community.id,
      community: community,
      identity: identity,
      profile: userProfile,
    } as ResponseCreateCommunityPayload
  }

  public joinCommunity(payload: InitCommunityPayload): Promise<ResponseJoinCommunityPayload | undefined> {
    return this.admissionMutationMutex.runExclusive(() => {
      this.requireCompletedLeave()
      return this.joinCommunityLocked(payload)
    })
  }

  private async joinCommunityLocked(payload: InitCommunityPayload): Promise<ResponseJoinCommunityPayload | undefined> {
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
    if (!(await this.prepareForNewAdmission())) return
    if (await this.rejectWhenCommunityExists(SocketActions.JOIN_COMMUNITY, payload.id)) return
    await this.erasePreviousCommunityArtifacts()

    const { seed, teamId } = inviteData.authData
    await this.sigChainService.createChainFromInvite({ seed }, teamId, true)

    const { community, identity } = await this.bootstrapCommunityFromInvitation(
      payload.id,
      inviteData,
      this.sigChainService.user.userId
    )

    const userProfile: UserProfile = {
      userId: identity.userId,
      nickname: payload.username,
    }
    await this.storageService.deferUserProfile(userProfile)

    return {
      id: community.id,
      community: community,
      identity: identity,
      profile: userProfile,
    } as ResponseJoinCommunityPayload
  }

  public async linkDevice(payload: InitDeviceLinkPayload): Promise<ResponseLinkDevicePayload | undefined> {
    return this.admissionMutationMutex.runExclusive(() => {
      this.requireCompletedLeave()
      return this.linkDeviceLocked(payload)
    })
  }

  private async linkDeviceLocked(payload: InitDeviceLinkPayload): Promise<ResponseLinkDevicePayload | undefined> {
    this.logger.info('Linking device to community', payload.id)
    const { inviteData } = payload
    if (inviteData == null || !isDeviceInvitationData(inviteData)) {
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

    if (
      payload.deviceLinkConsent !== true ||
      (inviteData.version === InvitationDataVersion.v5 &&
        inviteData.qssEnabled === true &&
        payload.confirmedQssEndpoint !== inviteData.qssEndpoint)
    ) {
      emitError(this.serverIoProvider.io, {
        type: SocketActions.LINK_DEVICE,
        message: ErrorMessages.NETWORK_SETUP_FAILED,
        community: payload.id,
      })
      return
    }

    if (!(await this.prepareForNewAdmission())) return

    if (await this.rejectWhenCommunityExists(SocketActions.LINK_DEVICE, payload.id)) return

    await this.erasePreviousCommunityArtifacts()

    const { seed, teamId, userId, userName } = inviteData.authData
    await this.sigChainService.createChainFromDeviceInvite(
      {
        seed,
        userName,
        deviceName: payload.deviceName,
        expectedTeamId: teamId,
        expectedUserId: userId,
      },
      teamId,
      true
    )

    const { community, identity } = await this.bootstrapCommunityFromInvitation(payload.id, inviteData, userId)
    return {
      id: community.id,
      community,
      identity,
    }
  }

  private async rejectWhenCommunityExists(action: SocketActions, communityId: string): Promise<boolean> {
    // A completed leave calls resetState(), and any records it leaves behind are erased by
    // erasePreviousCommunityArtifacts() further down this path. Only a community this service
    // is actually running may block a new one, or a create queued behind a slow leave would
    // be refused instead of replacing the community that was just left (#3424).
    if (this.communityState === ServiceState.DEFAULT && this.communityId === '') return false
    const communities = (await this.localDbService.getCommunities()) ?? {}
    if (Object.keys(communities).length === 0) return false
    emitError(this.serverIoProvider.io, {
      type: action,
      message: ErrorMessages.COMMUNITY_ALREADY_INITIALIZED,
      community: communityId,
    })
    return true
  }

  private async finishPendingAdmissionCleanup(): Promise<boolean> {
    const receipt = this.readAdmissionResetReceipt()
    if (receipt != null) return this.completeAdmissionResetReceipt(receipt)
    const cleanupCommunityId =
      this.admissionCleanupStartedCommunityId ??
      this.interruptedAdmissionCommunityId ??
      this.timedOutAdmissionCommunityId
    if (cleanupCommunityId == null) return true
    if (this.communityState !== ServiceState.DEFAULT) return false
    return this.resetAdmissionLocked(cleanupCommunityId)
  }

  private async prepareForNewAdmission(): Promise<boolean> {
    if (!(await this.finishPendingAdmissionCleanup())) return false
    const receipt = this.readAdmissionResetReceipt()
    if (receipt == null) return true
    if (receipt.phase !== 'complete' || (await this.findAdmissionResetReceiptConflict(receipt)) != null) return false
    this.clearAdmissionResetReceipt()
    this.replayableAdmissionResetReceipt = undefined
    return true
  }

  public async launchCommunity(id: string): Promise<void> {
    return this.admissionMutationMutex.runExclusive(() => this.launchCommunityLocked(id))
  }

  private async launchCommunityLocked(id: string): Promise<void> {
    if (this.admissionResetInFlight != null) return
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
    this.timedOutAdmissionCommunityId = undefined
    this.interruptedAdmissionCommunityId = undefined
    this.clearedAdmissionCommunityId = undefined
    this.logger.info(`Community state is now ${this.communityState}`)

    if (community.name) {
      try {
        this.logger.info('Loading sigchain for community', community.name)
        if (this.sigChainService.activeChainTeamId !== community.teamId) {
          await this.sigChainService.loadChain(community.teamId, true, community.name)
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
      const provisionalAdmission = this.isProvisionalAdmission(community)
      const admissionTimedOut = e instanceof AdmissionError && e.kind === 'timeout'
      const admissionInterrupted = e instanceof AdmissionError && e.kind === 'cancelled' && provisionalAdmission
      const invalidInvite =
        e instanceof AdmissionError &&
        /INVITATION_PROOF_INVALID|invitation.*(expired|invalid|not accepted)/i.test(e.message)
      if (admissionTimedOut) this.timedOutAdmissionCommunityId = community.id
      if (admissionInterrupted) {
        this.interruptedAdmissionCommunityId = community.id
        this.writeInterruptedAdmissionMarker(community.id)
      }
      if (invalidInvite && provisionalAdmission) {
        this.interruptedAdmissionCommunityId = community.id
        this.writeInterruptedAdmissionMarker(community.id)
        try {
          await this.resetAdmissionLocked(community.id)
        } catch (cleanupError) {
          this.logger.error('Failed to clear invalid invitation admission; cleanup can be retried', cleanupError)
        }
      }
      emitError(this.serverIoProvider.io, {
        type: SocketActions.LAUNCH_COMMUNITY,
        message: admissionTimedOut
          ? ErrorMessages.ADMISSION_TIMEOUT
          : admissionInterrupted
            ? ErrorMessages.ADMISSION_INTERRUPTED
            : invalidInvite
              ? ErrorMessages.INVALID_INVITE
              : ErrorMessages.COMMUNITY_LAUNCH_FAILED,
        community: community.id,
        trace: e.stack,
      })
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
    await this.tor.registerHiddenService({
      targetPort: this.ports.libp2pHiddenService,
      privKey: identity.networkInfo.hiddenService.privateKey,
      onionAddress: identity.networkInfo.hiddenService.onionAddress,
      virtPort: 80,
    })
    return identity.networkInfo.hiddenService.onionAddress
  }

  public async launch(community: Community) {
    const generation = ++this.launchGeneration
    const assertGeneration = () => {
      if (generation !== this.launchGeneration) throw new Error('Community launch generation was revoked')
    }
    this.logger.info(`Launching community ${community.id}`)

    const identity = await this.storageService.getIdentity(community.id)
    if (!identity) {
      throw new Error(ErrorMessages.IDENTITY_NOT_FOUND)
    }

    const useLocalTransport = isLocalTransportEnabled()
    const networkAddress = useLocalTransport
      ? identity.networkInfo.hiddenService.onionAddress
      : await this.spawnTorHiddenService(community.id, identity)

    if (useLocalTransport) {
      const localAddress = parseLocalAddress(networkAddress)
      if (localAddress == null) {
        throw new Error(`Local transport requires a 127.0.0.1:<port> peer address, received: ${networkAddress}`)
      }
      this.ports = { ...this.ports, libp2pHiddenService: localAddress.port }
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

    assertGeneration()
    const qssAdmissionEndpoint =
      community.qssEnabled === true &&
      community.inviteData?.version === InvitationDataVersion.v5 &&
      community.inviteData.qssEnabled
        ? community.inviteData.qssEndpoint
        : undefined
    const lease = new CommunityLifecycle(community.id, params, qssAdmissionEndpoint)
    let libp2pStartPromise: Promise<void> | undefined
    const ensureLibp2pStarted = async (): Promise<void> => {
      if (libp2pStartPromise == null) {
        libp2pStartPromise = lease.run(async () => {
          await this.libp2pService.createInstance(params, lease.signal)
          lease.assertCurrent()
        })
      }
      return libp2pStartPromise
    }

    let storageTeamId: string | undefined
    let setupStorageWithTeamMetaPromise: Promise<void> | undefined
    const setupStorageWithTeamMeta = async (teamId: string) => {
      if (storageTeamId != null && storageTeamId !== teamId) {
        throw new Error(`Storage metadata team mismatch: ${storageTeamId} !== ${teamId}`)
      }
      storageTeamId = teamId

      if (setupStorageWithTeamMetaPromise != null) {
        this.logger.info('Storage metadata setup already in progress, waiting')
        return setupStorageWithTeamMetaPromise
      }

      setupStorageWithTeamMetaPromise = lease.run(async () => {
        this.logger.info('Setting up storage')
        await this.storageService.init(teamId)
        lease.assertCurrent()
        this.qssService.markTeamStorageReady(teamId)
      })

      return setupStorageWithTeamMetaPromise
    }

    const activeChain = this.sigChainService.getActiveChain()
    const hasStorageReadyChain = activeChain.team != null && activeChain.roles.amIMemberOfRole(RoleName.MEMBER)
    if (hasStorageReadyChain) {
      await this.scrubStoredInvitation(community)
      this.communityLifecycle = lease
      this.logger.debug('Active chain already has team and user is a member, setting up storage immediately')
      await ensureLibp2pStarted()
      await setupStorageWithTeamMeta(activeChain.team!.id)
      void lease
        .run(async () => {
          await this.qssService.connect(community.qssEndpoint)
        })
        .catch(error => {
          this.logger.warn('Restored community QSS startup stopped', error)
        })
      await lease.run(async () => this._updateTeamIdOnStoredCommunity(community, activeChain))
    } else {
      const inviteData = community.inviteData
      if (inviteData == null) {
        throw new Error(`Cannot coordinate admission for community ${community.id} without invitation data`)
      }
      const teamId = community.teamId ?? inviteData.authData.teamId
      const handle = this.admissionCoordinator.start(
        {
          communityId: community.id,
          teamId,
          expectedUserId: identity.userId,
          expectedDeviceId: activeChain.device.deviceId,
          kind: activeChain.isPendingDeviceAdmission ? AdmissionKind.DEVICE : AdmissionKind.MEMBER,
          preferredTransport: qssAdmissionEndpoint != null ? AdmissionTransport.QSS : AdmissionTransport.P2P,
          timeoutMs: INVITATION_ADMISSION_TIMEOUT_MS,
        },
        lease
      )
      // A rejected concurrent start must not replace the lifecycle that still owns admission.
      this.communityLifecycle = lease
      const admission = await handle.result
      // Once the admitted chain is durable and published, the invitation seed is no
      // longer recovery material. Remove it even if later service startup is cancelled.
      await this.scrubStoredInvitation(community)
      lease.assertCurrent()

      await ensureLibp2pStarted()
      lease.assertCurrent()
      await setupStorageWithTeamMeta(admission.teamId)
      await lease.run(async () => {
        await this.qssService.syncNativePushPrerequisites(
          admission.teamId,
          this.sigChainService.getActiveChain(),
          'coordinated join completed'
        )
        lease.assertCurrent()
        await this._updateTeamIdOnStoredCommunity(community, admission.teamId)
        lease.assertCurrent()
      })
      if (admission.transport === AdmissionTransport.P2P && qssAdmissionEndpoint != null) {
        void lease
          .run(async () => {
            await this.qssService.resume()
            lease.assertCurrent()
            const result = await this.qssService.connect(qssAdmissionEndpoint)
            lease.assertCurrent()
            if (result === QSSOperationResult.SUCCESS) await this.qssService.authenticateCurrentCommunity()
          })
          .catch(error => this.logger.warn('Post-admission QSS synchronization stopped', error))
      }
    }

    lease.assertCurrent()
    if (useLocalTransport || this.tor.bootstrapped) {
      this.serverIoProvider.io.emit(SocketEvents.TOR_INITIALIZED)
    }

    this.logger.info('Storage initialized')
    this.serverIoProvider.io.emit(SocketEvents.CONNECTION_PROCESS_INFO, ConnectionProcessInfo.CONNECTING_TO_COMMUNITY)
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
    await this.localDbService.updateCommunity(community.id, { teamId })
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

    this.socketService.on(SocketActions.START, () => {
      this.reportCompletedAdmissionReset()
      this.reportInterruptedAdmission()
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
        this.logger.info(`socketService - ${SocketActions.LINK_DEVICE}`)
        try {
          callback(await this.linkDevice(args))
        } catch (e) {
          this.logger.error('Error while handling link device request', e)
          callback(undefined)
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

    this.socketService.on(
      SocketActions.RESET_ADMISSION,
      async ({ id }: LaunchCommunityPayload, callback: (success: boolean) => void) => {
        try {
          callback(await this.resetAdmission(id))
        } catch (error) {
          this.logger.error('Failed to clear timed-out invitation', error)
          callback(false)
        }
      }
    )

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
        if (this.sigChainService.activeChainTeamId == null) {
          this.logger.warn(`No sigchain configured, skipping device link generation!`)
          callback(undefined)
          return
        }

        try {
          const deviceInvite = this.sigChainService.getActiveChain().invites.createDeviceInvite()
          await this.sigChainService.saveChain(this.sigChainService.activeChainTeamId)
          callback(deviceInvite)
        } catch (e) {
          this.logger.error(`Failed to generate a device link!`, e)
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
      let toggleAccepted = false
      try {
        if (payload) {
          toggleAccepted = await this.libp2pService.resume()
          await this.storageService.startSync()
        } else {
          toggleAccepted = await this.libp2pService.pause()
          await this.storageService.stopSync()
        }
      } catch (e) {
        this.logger.error('Error toggling libp2p service', e)
      }

      callback(toggleAccepted ? payload : this.libp2pService.state === Libp2pState.Started)
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
      this.serverIoProvider.io.emit(SocketEvents.USER_PROFILES_STORED, payload)
    })
    this.storageService.on(StorageEvents.NETWORK_ENDPOINTS_STORED, (payload: NetworkEndpointsStoredEvent) => {
      this.serverIoProvider.io.emit(SocketEvents.NETWORK_ENDPOINTS_STORED, payload)
      void (async () => {
        await this.storageService.updatePeerStore()
        await this.libp2pService.addPeersToDialQueue()
      })().catch(error => this.logger.error('Failed to apply stored network endpoints', error))
    })
  }
}
