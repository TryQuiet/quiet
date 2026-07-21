import * as uint8arrays from 'uint8arrays'
import fs from 'fs'
import path from 'path'
import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { EventEmitter } from 'events'
import getPort from 'get-port'
import { Agent } from 'https'
import { CryptoEngine, setEngine } from 'pkijs'
import * as url from 'node:url'
import { createPeerId, generateLibp2pPSK } from '../common/utils'

import { createLibp2pAddress, isPSKcodeValid } from '@quiet/common'
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
  ServerHost,
  AddMembersChannelPayload,
  AddMembersChannelResponse,
  PublicChannel,
  User,
  UserProfilesUpdatedPayload,
  UpdateCommunityPayload,
  ChannelOperationStatus,
  DebugAddServerPayload,
  type PrivateChannelPermissions,
  type SetChannelPermissionsPayload,
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
import { ServiceState, TorInitState } from './connections-manager.types'
import { DateTime } from 'luxon'
import { createLogger } from '../common/logger'
import { peerIdFromString } from '@libp2p/peer-id'
import { privateKeyFromRaw } from '@libp2p/crypto/keys'
import { SigChainService } from '../auth/sigchain.service'
import { QSSService } from '../qss/qss.service'
import { RoleName } from '../auth/services/roles/roles'
import { QSSEvents } from '../qss/qss.types'
import { SigchainEvents } from '../auth/types'
import { QPSService } from '../qps/qps.service'
import { CaptchaService } from '../captcha/captcha.service'
import { SigChain } from '../auth/sigchain'
import { createKeyset, Member, redactKeys, type Server } from '@localfirst/auth'
import type { PrivateChannelMappings } from '../storage/channels/channels.types'

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

    if (this.configOptions.torControlPort) {
      await this.migrateLevelDb()
      await this.launchCommunityFromStorage()
    }
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
    await this.closeSocket()
    this.logger.info('Pausing libp2pService!')
  }

  public async resume() {
    this.logger.info('Resuming!')
    // A lifecycle transition only needs the data server to accept connections.
    // Waiting for the frontend START event here would prevent a later pause
    // from running if the app returns to the background before reconnecting.
    await this.socketService.listen()
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

  private static readonly LEAVE_IN_PROGRESS_MARKER = '.leave-in-progress'

  private leaveInProgressMarkerPath(): string {
    return path.join(this.storageService.quietDir, ConnectionsManagerService.LEAVE_IN_PROGRESS_MARKER)
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

    this.logger.info('Creating hidden service')
    const hiddenService = await this.tor.createNewHiddenService({ targetPort: this.ports.libp2pHiddenService })
    await this.tor.destroyHiddenService(hiddenService.onionAddress.split('.')[0])
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
      qssEnabled: this.qssAllowed && payload.useServer && payload.tosAccepted,
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
      tosAccepted: payload.tosAccepted,
    }

    if (community.qssEnabled && payload.tosAccepted && community.qssEndpoint) {
      if (this.qssEndpoint) {
        let host = url.parse(this.qssEndpoint).hostname
        if (host === '127.0.0.1') {
          host = 'localhost'
        }
        if (host) {
          community.serverHosts = [{ hostUrl: host, accepted: true } as ServerHost]
        }
      }
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

    return {
      id: community.id,
      community: community,
      identity: identity,
      profile: userProfile,
    } as ResponseJoinCommunityPayload
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
      emitError(this.serverIoProvider.io, {
        type: SocketActions.LAUNCH_COMMUNITY,
        message: ErrorMessages.COMMUNITY_LAUNCH_FAILED,
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
    this.logger.info(`Spawning hidden service for community ${communityId}, peer: ${identity.networkInfo.peerId.id}`)
    this.serverIoProvider.io.emit(SocketEvents.CONNECTION_PROCESS_INFO, ConnectionProcessInfo.SPAWNING_HIDDEN_SERVICE)
    return await this.tor.spawnHiddenService({
      targetPort: this.ports.libp2pHiddenService,
      privKey: identity.networkInfo.hiddenService.privateKey,
    })
  }

  public async launch(community: Community) {
    this.logger.info(`Launching community ${community.id}`)

    const identity = await this.storageService.getIdentity(community.id)
    if (!identity) {
      throw new Error(ErrorMessages.IDENTITY_NOT_FOUND)
    }

    const onionAddress = await this.spawnTorHiddenService(community.id, identity)

    const peerIdData: CreatedLibp2pPeerId = {
      peerId: peerIdFromString(identity.networkInfo.peerId.id),
      privKey: privateKeyFromRaw(uint8arrays.fromString(identity.networkInfo.peerId.privKey, 'base64')),
    }
    const localAddress = createLibp2pAddress(onionAddress, peerIdData.peerId.toString())

    const params: Libp2pNodeParams = {
      peerId: peerIdData,
      listenAddresses: [this.libp2pService.createLibp2pListenAddress(onionAddress)],
      agent: this.socksProxyAgent,
      localAddress: localAddress,
      targetPort: this.ports.libp2pHiddenService,
      psk: generateLibp2pPSK(community.psk).fullKey,
      torBootstrap: this.tor,
    }
    await this.libp2pService.createInstance(params)

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

      setupStorageWithTeamMetaPromise = (async () => {
        this.logger.info('Setting up storage')
        await this.storageService.init(teamId)
        this.qssService.markTeamStorageReady(teamId)
      })()

      return setupStorageWithTeamMetaPromise
    }

    const activeChain = this.sigChainService.getActiveChain()
    const hasStorageReadyChain = activeChain.team != null && activeChain.roles.amIMemberOfRole(RoleName.MEMBER)
    if (hasStorageReadyChain) {
      this.logger.debug('Active chain already has team and user is a member, setting up storage immediately')
      await setupStorageWithTeamMeta(activeChain.team!.id)
      this.qssService.connect(community.qssEndpoint)
      await this._updateTeamIdOnStoredCommunity(community, activeChain)
    } else {
      this.logger.debug(
        'Active chain does not have team or user is not a member, waiting for team metadata before setting up storage'
      )
      const storageReadyPromise = new Promise<void>((resolve, reject) => {
        const handleStorageReady = async (teamId: string) => {
          try {
            await setupStorageWithTeamMeta(teamId)
            await this._updateTeamIdOnStoredCommunity(community, teamId)
            resolve()
          } catch (e) {
            reject(e)
          }
        }

        this.qssService.once(QSSEvents.QSS_FULLY_JOINED, (teamId: string) => {
          this.logger.info(`Handling ${QSSEvents.QSS_FULLY_JOINED} event`, teamId)
          void handleStorageReady(teamId)
        })
        this.libp2pService.once(Libp2pEvents.AUTH_JOINED, (payload: { peer: string }) => {
          this.logger.info(`Handling ${Libp2pEvents.AUTH_JOINED} event`, payload)
          const teamId = this.sigChainService.getActiveChain().team?.id
          if (teamId == null) {
            reject(new Error(`Cannot initialize storage after ${Libp2pEvents.AUTH_JOINED}; active chain has no team`))
            return
          }
          void handleStorageReady(teamId)
        })
      })

      this.qssService.connect(community.qssEndpoint)

      if (await this.tor.isBootstrappingFinished()) {
        this.serverIoProvider.io.emit(SocketEvents.TOR_INITIALIZED)
      }
      this.serverIoProvider.io.emit(SocketEvents.CONNECTION_PROCESS_INFO, ConnectionProcessInfo.CONNECTING_TO_COMMUNITY)

      await storageReadyPromise
    }

    if (await this.tor.isBootstrappingFinished()) {
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
   * Update user records in the state manager based on sigchain user data and private channel metadata (to get channel membership)
   *
   * @param sourceEvent The emitted event whose handler triggered the update
   * @param teamId ID of the LFA team/Quiet community that was updated
   */
  private async _updateUsersInStateManager(sourceEvent: string, teamId: string): Promise<void> {
    this.logger.debug('Updating users after source event', sourceEvent, teamId)
    if (!this.sigChainService) {
      this.logger.warn(`Skipping users update, sigchainservice hasn't been initialized`)
      return
    }

    // handle chain updates
    const sigChain = this.sigChainService.getChain(teamId)
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

    this.socketService.on(SocketActions.LEAVE_COMMUNITY, async (callback: (closed: boolean) => void) => {
      this.logger.info(`socketService - ${SocketActions.LEAVE_COMMUNITY}`)
      try {
        callback(await this.leaveCommunity())
      } catch (e) {
        this.logger.error('Error while handling leave community request', e)
        callback(false)
      }
    })

    this.socketService.on(SocketActions.UPDATE_COMMUNITY, async (payload: UpdateCommunityPayload) => {
      this.logger.info(`socketService - ${SocketActions.UPDATE_COMMUNITY}`)
      const community = await this.localDbService.getCommunity(payload.id)
      if (!community) {
        this.logger.error(`No community found with id ${payload.id}`)
        return
      }
      const updatedCommunity = { ...community, ...payload.updates }
      await this.localDbService.setCommunity(updatedCommunity)

      const qssBecameUsable =
        updatedCommunity.qssEnabled && updatedCommunity.tosAccepted && (!community.qssEnabled || !community.tosAccepted)
      if (qssBecameUsable) {
        await this.qssService.connect(updatedCommunity.qssEndpoint)
      }
    })

    this.socketService.on(SocketActions.DEBUG_ADD_SERVER, async (payload: DebugAddServerPayload) => {
      this.logger.info(`socketService - ${SocketActions.DEBUG_ADD_SERVER}`)
      try {
        await this.debugAddServer(payload)
      } catch (e) {
        this.logger.error('Error while adding a debug server', e)
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
            const qssInitStatus = await this.qssService.getQssInitStatus()
            // create the lockboxes using invite-based keys for users to self-assign the MEMBER role
            if (qssInitStatus.qssEnabled) {
              this.sigChainService.activeChain.lockbox.createInviteLockboxes(newInvite.seed, newInvite.salt)
            }
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

  private async debugAddServer(payload: DebugAddServerPayload): Promise<void> {
    if (process.env.NODE_ENV !== 'development' && process.env.IS_E2E !== 'true') {
      this.logger.warn('Ignoring debug server request outside development and E2E')
      return
    }

    const community = await this.localDbService.getCurrentCommunity()
    if (!community) {
      this.logger.warn('No active community found for debug server request')
      return
    }

    const sigChain = this.sigChainService.getActiveChain(false)
    if (!sigChain?.team || sigChain.teamId !== community.teamId) {
      this.logger.warn(`No active sigchain found for community ${community.id}`)
      return
    }

    const serverHosts = [...new Set(payload.serverHosts.map(host => host.trim()).filter(Boolean))]
    if (serverHosts.length === 0) {
      return
    }

    const knownHosts = new Map(community.serverHosts?.map(server => [server.hostUrl, server]) ?? [])
    for (const hostUrl of serverHosts) {
      knownHosts.set(hostUrl, { hostUrl, accepted: true })
    }
    const updatedServerHosts = [...knownHosts.values()]

    await this.localDbService.setCommunity({ ...community, serverHosts: updatedServerHosts })
    this.serverIoProvider.io.emit(SocketEvents.COMMUNITY_UPDATED, {
      id: community.id,
      updates: { serverHosts: updatedServerHosts },
    })

    for (const host of serverHosts) {
      if (sigChain.team.hasServer(host)) {
        continue
      }
      const server: Server = {
        host,
        keys: redactKeys(createKeyset({ type: 'SERVER', name: host })),
      }
      sigChain.server.addServer(server)
    }
  }

  /**
   * Handle events from the sigchain service and update data in the state manager
   */
  private attachSigchainListeners() {
    if (!this.sigChainService) return

    this.sigChainService.on(SigchainEvents.UPDATED, async (teamId: string) => {
      await this._updateUsersInStateManager(SigchainEvents.UPDATED, teamId)
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
        await this._updateUsersInStateManager(StorageEvents.INITIALIZED, activeChain.team!.id)
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
        await this._updateUsersInStateManager(StorageEvents.CHANNELS_STORED, activeChain.team!.id)
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
