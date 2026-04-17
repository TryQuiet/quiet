import * as uint8arrays from 'uint8arrays'
import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { EventEmitter } from 'events'
import getPort from 'get-port'
import { Agent } from 'https'
import { CryptoEngine, setEngine } from 'pkijs'
import { createPeerId } from '../common/utils'

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
  InvitationDataV2,
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
  InvitationData,
  SetUserProfileResponse,
  UserProfilesUpdatedPayload,
} from '@quiet/types'
import { CONFIG_OPTIONS, QSS_ALLOWED, QSS_ENDPOINT, SERVER_IO_PROVIDER, SOCKS_PROXY_AGENT } from '../const'
import { Libp2pService, Libp2pState } from '../libp2p/libp2p.service'
import { CreatedLibp2pPeerId, Libp2pEvents, Libp2pNodeParams, Libp2pPeerInfo } from '../libp2p/libp2p.types'
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
import { QPSService } from '../qps/qps.service'

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
  private peerInfo: Libp2pPeerInfo | undefined = undefined

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
    private readonly qpsService: QPSService
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
    const community: Community | undefined = await this.localDbService.getCurrentCommunity()
    if (!community) {
      this.logger.info('No community found in storage')
      return
    }

    if (community.name) {
      try {
        this.logger.info('Loading sigchain for community', community.name)
        await this.sigChainService.loadChain(community.name, true)
        this.qssService.connect(community.qssEndpoint)
      } catch (e) {
        this.logger.warn('Failed to load sigchain', e)
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
      await this.sigChainService.saveChain(this.sigChainService.activeChainTeamName!)
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
    await this.openSocket()
    this.libp2pService?.resume()
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

  // This method is only used on iOS through rn-bridge for reacting on lifecycle changes
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

    await this.sigChainService.deleteChain(this.sigChainService.activeChainTeamName!, options.deleteChainFromDisk)

    if (this.localDbService) {
      this.logger.info('Closing local DB')
      await this.localDbService.close()
    }
  }

  public async leaveCommunity(): Promise<boolean> {
    this.logger.info('Running leaveCommunity')
    this.logger.info('Tombstoning notification tokens before leave')
    const tombstoneAcked = await this.qpsService.tombstoneCurrentUserNotificationTokens()
    if (!tombstoneAcked) {
      this.logger.warn('Proceeding with leave without confirmed notification token tombstone ack')
    }

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

    return true
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

    this.logger.info(`Creating new LFA chain`)
    const sigchain = await this.sigChainService.createChain(payload.name, payload.username, true)
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
      psk: Libp2pService.generateLibp2pPSK().psk,
      ownership: CommunityOwnership.Owner,
      teamId: sigchain.team?.id,
      qssEnabled: this.qssAllowed && payload.useServer,
      qssEndpoint: this.qssEndpoint,
      tosAccepted: payload.tosAccepted,
    }

    await this.localDbService.setCommunity(community)
    await this.localDbService.setCurrentCommunityId(community.id)

    this.qssService.connect(this.qssEndpoint)

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

  private async joinViaQSS(inviteData: InvitationData) {
    if (
      inviteData.version === InvitationDataVersion.v3 &&
      inviteData.qssEnabled &&
      inviteData.authData.teamId != null &&
      inviteData.qssEndpoint != null
    ) {
      await this.qssService.connect(inviteData.qssEndpoint, true)
    }
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
    let communityName: string | undefined
    if (
      inviteData &&
      (inviteData?.version === InvitationDataVersion.v2 || inviteData?.version === InvitationDataVersion.v3)
    ) {
      communityName = (payload.inviteData as InvitationDataV2).authData.communityName
      await this.sigChainService.createChainFromInvite(
        payload.username,
        communityName,
        inviteData.authData.seed,
        inviteData.authData.teamId,
        true
      )
      try {
        this.joinViaQSS(inviteData)
      } catch (error) {
        this.logger.error(`Failed signing into qss community ${communityName}`, error)
      }
    }

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
    this.localDbService.updatePeerStats(bootstrapPeerStats)

    const community: Community = {
      id: payload.id,
      name: communityName,
      peerList: [...new Set([localAddress, ...Object.keys(bootstrapPeerStats)])], // TODO: we should deprecate this field and use db
      inviteData,
      psk: inviteData.psk,
      teamId: inviteData.version === InvitationDataVersion.v3 ? inviteData.authData.teamId : undefined,
      ownership: CommunityOwnership.User,
      qssEnabled: inviteData?.version === InvitationDataVersion.v3 ? inviteData.qssEnabled : undefined,
      qssEndpoint: inviteData?.version === InvitationDataVersion.v3 ? inviteData.qssEndpoint : undefined,
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
    this.storageService.addUserProfile(userProfile)

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
        if (this.sigChainService.activeChainTeamName !== community.name) {
          await this.sigChainService.loadChain(community.name, true)
        }
      } catch (e) {
        this.logger.warn('Failed to load sigchain', e)
      }
    } else {
      this.logger.warn('No community name found in storage')
    }

    try {
      await this.launch(community)
    } catch (e) {
      this.logger.error(`Failed to launch community ${community.id}`, e)
      emitError(this.serverIoProvider.io, {
        type: SocketActions.JOIN_COMMUNITY,
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
      psk: Libp2pService.generateLibp2pPSK(community.psk).fullKey,
    }
    await this.libp2pService.createInstance(params)

    const setupStorage = async () => {
      this.logger.info('Setting up storage')
      await this.storageService.init()
    }

    const activeChain = this.sigChainService.getActiveChain()
    if (activeChain.team != null && activeChain.roles.amIMemberOfRole(RoleName.MEMBER)) {
      await setupStorage()
      this.storageService.addTeamIdToDbMetas(activeChain.team!.id)
    } else {
      this.qssService.once(QSSEvents.QSS_FULLY_JOINED, async (teamId: string) => {
        this.logger.info(`Handling ${QSSEvents.QSS_FULLY_JOINED} event`, teamId)
        await setupStorage()
        this.storageService.addTeamIdToDbMetas(teamId)
        this.logger.info('Fully joined event received, starting log entry pull interval', teamId)
        this.qssService.startLogPullInterval(teamId)
      })
      this.libp2pService.once(Libp2pEvents.AUTH_JOINED, async (payload: { peer: string }) => {
        this.logger.info(`Handling ${Libp2pEvents.AUTH_JOINED} event`, payload)
        await setupStorage()
        this.storageService.addTeamIdToDbMetas(activeChain.team!.id)
      })
    }
    if (await this.tor.isBootstrappingFinished()) {
      this.serverIoProvider.io.emit(SocketEvents.TOR_INITIALIZED)
    }

    this.logger.info('Storage initialized')
    this.serverIoProvider.io.emit(SocketEvents.CONNECTION_PROCESS_INFO, ConnectionProcessInfo.CONNECTING_TO_COMMUNITY)
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
        callback(await this.createCommunity(args))
      }
    )
    this.socketService.on(
      SocketActions.JOIN_COMMUNITY,
      async (args: InitCommunityPayload, callback: (response: ResponseJoinCommunityPayload | undefined) => void) => {
        this.logger.info(`socketService - ${SocketActions.JOIN_COMMUNITY}`)
        callback(await this.joinCommunity(args))
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
        if (this.sigChainService.activeChainTeamName == null) {
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
            await this.sigChainService.saveChain(this.sigChainService.activeChainTeamName)
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
        callback(await this.storageService?.channels.handleCreateChannel(payload))
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
   * Forwards events from the storage service to the the state manager
   * (also applies some side effects)
   */
  private attachStorageListeners() {
    if (!this.storageService) return
    // Channel and Message Events
    this.storageService.channels.on(StorageEvents.CHANNELS_STORED, (payload: ChannelsReplicatedPayload) => {
      this.logger.info(`Storage - ${StorageEvents.CHANNELS_STORED}`)
      this.serverIoProvider.io.emit(SocketEvents.CHANNELS_STORED, payload)
      this.logger.info(`Storage (emitted) - ${SocketEvents.CHANNELS_STORED}`)
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
