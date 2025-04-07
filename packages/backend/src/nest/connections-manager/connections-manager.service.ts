import { toString as uint8ArrayToString } from 'uint8arrays/to-string'
import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { Crypto } from '@peculiar/webcrypto'
import { EventEmitter } from 'events'
import fs from 'fs'
import getPort from 'get-port'
import { Agent } from 'https'
import path from 'path'
import { CryptoEngine, setEngine } from 'pkijs'
import { createPeerId, removeFilesFromDir } from '../common/utils'

import { createLibp2pAddress, filterValidAddresses, isPSKcodeValid, pairsToP2pAddresses } from '@quiet/common'
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
  NetworkDataPayload,
  NetworkInfo,
  NetworkStats,
  PushNotificationPayload,
  RemoveDownloadStatus,
  SendMessagePayload,
  SocketActions,
  SocketEvents,
  UploadFilePayload,
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
} from '@quiet/types'
import { CONFIG_OPTIONS, QUIET_DIR, SERVER_IO_PROVIDER, SOCKS_PROXY_AGENT } from '../const'
import { Libp2pService } from '../libp2p/libp2p.service'
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
import { Base58, InviteResult } from '3rd-party/auth/packages/auth/dist'

/**
 * A monolith service that handles lots of events received from the state-manager.
 */
@Injectable()
export class ConnectionsManagerService extends EventEmitter implements OnModuleInit {
  public communityId: string
  public communityState: ServiceState
  private ports: GetPorts
  isTorInit: TorInitState = TorInitState.NOT_STARTED
  private peerInfo: Libp2pPeerInfo | undefined = undefined

  private readonly logger = createLogger(ConnectionsManagerService.name)
  constructor(
    @Inject(SERVER_IO_PROVIDER) public readonly serverIoProvider: ServerIoProviderTypes,
    @Inject(CONFIG_OPTIONS) public configOptions: ConfigOptions,
    @Inject(QUIET_DIR) public readonly quietDir: string,
    @Inject(SOCKS_PROXY_AGENT) public readonly socksProxyAgent: Agent,
    private readonly socketService: SocketService,
    public readonly libp2pService: Libp2pService,
    private readonly localDbService: LocalDbService,
    private readonly storageService: StorageService,
    private readonly tor: Tor,
    private readonly sigChainService: SigChainService
  ) {
    super()
  }

  async onModuleInit() {
    process.on('unhandledRejection', reason => {
      // console.log(`why won't this log rejection`, (reason as any).message)
      this.logger.error(`Unhandled rejection`, reason)
      throw new Error(`Unhandled Rejection`)
    })

    // process.on('SIGINT', function () {
    //   // This is not graceful even in a single percent. we must close services first, not just kill process %
    //   // this.logger.info('\nGracefully shutting down from SIGINT (Ctrl-C)')
    //   process.exit(0)
    // })
    const webcrypto = new Crypto()
    // @ts-ignore
    global.crypto = webcrypto

    setEngine(
      'newEngine',
      // @ts-ignore
      new CryptoEngine({
        name: 'newEngine',
        // @ts-ignore
        crypto: webcrypto,
      })
    )

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

    const identity = await this.storageService.getIdentity(community.id)
    if (!identity) {
      this.logger.warn('No identity found in storage')
      return
    }

    if (community.name) {
      try {
        this.logger.info('Loading sigchain for community', community.name)
        await this.sigChainService.loadChain(community.name, true)
      } catch (e) {
        this.logger.warn('Failed to load sigchain', e)
      }
    } else {
      this.logger.warn('No community name found in storage')
    }

    const sortedPeers = await this.localDbService.getSortedPeers(community.peerList ?? [])
    this.logger.info('launchCommunityFromStorage - sorted peers', sortedPeers)
    if (sortedPeers.length > 0) {
      community.peerList = sortedPeers
    }
    await this.localDbService.setCommunity(community)

    this.logger.info('Launching community from storage with peers', community.peerList)
    await this.launchCommunity(community)
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
    await this.closeSocket()
    this.logger.info('Pausing libp2pService!')
    this.peerInfo = await this.libp2pService?.pause()
    this.logger.info('Found the following peer info on pause: ', this.peerInfo)
  }

  public async resume() {
    this.logger.info('Resuming!')
    await this.openSocket()
    const peersToDial = await this.getPeersOnResume()
    this.libp2pService?.resume(peersToDial)
  }

  public async getPeersOnResume(): Promise<string[]> {
    this.logger.info('Getting peers to redial')
    if (this.peerInfo && (this.peerInfo?.connected.length !== 0 || this.peerInfo?.dialed.length !== 0)) {
      this.logger.info('Found peer info from pause: ', this.peerInfo)
      return [...this.peerInfo.connected, ...this.peerInfo.dialed]
    }

    this.logger.info('Getting peers from stored community (if exists)')
    const community = await this.localDbService.getCurrentCommunity()
    if (!community) {
      this.logger.warn(`No community launched, no peers found`)
      return []
    }
    return await this.localDbService.getSortedPeers(community.peerList ?? [])
  }

  // This method is only used on iOS through rn-bridge for reacting on lifecycle changes
  public async openSocket() {
    await this.socketService.init()
  }

  public async closeAllServices(
    options: { saveTor: boolean; closeDatastore: boolean } = { saveTor: false, closeDatastore: true }
  ) {
    this.logger.info('Saving active sigchain')
    await this.saveActiveChain()
    await this.sigChainService.deleteChain(this.sigChainService.activeChainTeamName!, false)

    this.logger.info('Closing services', options)

    await this.closeSocket()

    if (this.tor && !options.saveTor) {
      this.logger.info('Killing tor')
      await this.tor.kill()
    } else if (options.saveTor) {
      this.logger.info('Saving tor')
    }
    if (this.storageService) {
      this.logger.info('Stopping StorageService')
      await this.storageService?.stop()
    }
    if (this.libp2pService) {
      this.logger.info('Stopping libp2p')
      await this.libp2pService.close(options.closeDatastore)
    }
    if (this.localDbService) {
      this.logger.info('Closing local DB')
      await this.localDbService.close()
    }
  }

  public async leaveCommunity(): Promise<boolean> {
    this.logger.info('Running leaveCommunity')

    await this.closeAllServices({ saveTor: true, closeDatastore: false })

    this.logger.info('Resetting StorageService')
    await this.storageService.clean()

    this.logger.info('Cleaning libp2p datastore')
    await this.libp2pService.cleanDatastore()

    this.logger.info('Closing libp2p datastore')
    await this.libp2pService.closeDatastore()

    this.logger.info('Purging data')
    await this.purgeData()

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

  public async purgeData() {
    this.logger.info('Purging community data')
    const dirsToRemove = fs
      .readdirSync(this.quietDir)
      .filter(
        i =>
          i.startsWith('Ipfs') ||
          i.startsWith('OrbitDB') ||
          i.startsWith('backendDB') ||
          i.startsWith('Local Storage') ||
          i.startsWith('libp2pDatastore') ||
          i.startsWith('databases')
      )
    for (const dir of dirsToRemove) {
      const dirPath = path.join(this.quietDir, dir)
      this.logger.info(`Removing dir: ${dirPath}`)
      removeFilesFromDir(dirPath)
    }
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
      privKey: uint8ArrayToString(peerId.privKey.raw, 'base64'),
      noiseKey: uint8ArrayToString(peerId.noiseKey, 'base64'),
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
    await this.sigChainService.createChain(payload.name, payload.username, true)
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
    }

    await this.localDbService.setCommunity(community)
    await this.localDbService.setCurrentCommunityId(community.id)

    await this.launchCommunity(community)

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
    if (inviteData && inviteData?.version == InvitationDataVersion.v2) {
      communityName = (payload.inviteData as InvitationDataV2).authData.communityName
      this.sigChainService.createChainFromInvite(payload.username, communityName, inviteData.authData.seed, true)
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
    const peers = pairsToP2pAddresses(inviteData.pairs)
    const community = {
      id: payload.id,
      name: communityName,
      peerList: [...new Set([localAddress, ...peers])],
      inviteData,
      psk: inviteData.psk,
      ownership: CommunityOwnership.User,
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
    } as ResponseJoinCommunityPayload
  }

  public async launchCommunity(community: Community) {
    if ([ServiceState.LAUNCHING, ServiceState.LAUNCHED].includes(this.communityState)) {
      this.logger.error(
        'Cannot launch community more than once.' +
          ' Community has already been launched or is currently being launched.'
      )
      return
    }
    this.communityState = ServiceState.LAUNCHING
    this.logger.info(`Community state is now ${this.communityState}`)

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

    this.logger.info(JSON.stringify(identity.networkInfo.peerId, null, 2))
    const peerIdData: CreatedLibp2pPeerId = {
      peerId: peerIdFromString(identity.networkInfo.peerId.id),
      privKey: privateKeyFromRaw(Buffer.from(identity.networkInfo.peerId.privKey, 'base64')),
      noiseKey: Buffer.from(identity.networkInfo.peerId.noiseKey, 'base64'),
    }
    this.logger.info(peerIdData.peerId.toString())
    const peers = filterValidAddresses(community.peerList ? community.peerList : [])
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

    // Libp2p event listeners
    this.libp2pService.on(Libp2pEvents.PEER_CONNECTED, async (payload: { peers: string[] }) => {
      this.logger.info(`Handling ${Libp2pEvents.PEER_CONNECTED} event - adding network stats`, payload)
      for (const peer of payload.peers) {
        const peerStats: NetworkStats = {
          peerId: peer,
          connectionTime: 0,
          lastSeen: DateTime.utc().toSeconds(),
        }

        await this.localDbService.update(LocalDBKeys.PEERS, {
          [peer]: peerStats,
        })

        this.serverIoProvider.io.emit(SocketEvents.PEER_CONNECTED, {
          peer: peerStats.peerId,
          lastSeen: peerStats.lastSeen,
          connectionDuration: 0,
        })
      }
    })

    this.libp2pService.on(Libp2pEvents.PEER_DISCONNECTED, async (payload: NetworkDataPayload) => {
      this.logger.info(`Handling ${Libp2pEvents.PEER_DISCONNECTED} event - updating connection time`, payload)
      const peerPrevStats = await this.localDbService.find(LocalDBKeys.PEERS, payload.peer)
      const prev = peerPrevStats?.connectionTime || 0

      const peerStats: NetworkStats = {
        peerId: payload.peer,
        connectionTime: prev + payload.connectionDuration,
        lastSeen: payload.lastSeen,
      }

      await this.localDbService.update(LocalDBKeys.PEERS, {
        [payload.peer]: peerStats,
      })

      this.serverIoProvider.io.emit(SocketEvents.PEER_DISCONNECTED, payload)
    })

    const setupStorage = async () => {
      this.logger.info('Setting up storage')
      await this.storageService.init(peerIdData.peerId)
    }

    if (this.sigChainService.getActiveChain().team != null) {
      await setupStorage()
    } else {
      this.libp2pService.once(Libp2pEvents.AUTH_JOINED, async (payload: { peer: string }) => {
        this.logger.info('Handling AUTH_JOINED event', payload)
        await setupStorage()
      })
    }

    // FIXME: Don't await this
    // FIXME: Wait until Tor is bootstrapped to dial peers
    this.libp2pService.dialPeers(peers ?? [])

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
    this.socketService.on(SocketActions.CONNECTION, async () => {
      this.logger.info(`socketService - ${SocketActions.CONNECTION}`)
    })

    // TOOD: implement with multiple communities
    // this.socketService.on(SocketActions.LAUNCH_COMMUNITY, async (args: LaunchCommunityPayload) => {
    //   this.logger.info(`socketService - ${SocketActions.LAUNCH_COMMUNITY}`)
    //   this.logger.info('Not implemented yet')
    // })

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
      callback(await this.leaveCommunity())
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
      async (payload: { channelId: string }, callback: (response: DeleteChannelResponse) => void) => {
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
    this.socketService.on(SocketActions.UPLOAD_FILE, async (metadata: FileMetadata) => {
      await this.storageService?.channels.uploadFile(metadata)
    })
    this.socketService.on(SocketEvents.FILE_UPLOADED, async (args: FileMetadata) => {
      await this.storageService?.channels.uploadFile(args)
    })
    this.socketService.on(SocketActions.CANCEL_DOWNLOAD, mid => {
      this.storageService?.channels.cancelDownload(mid)
    })

    // System
    this.socketService.on(SocketActions.CLOSE, async () => {
      await this.closeAllServices()
    })

    // User Profile
    this.socketService.on(SocketActions.SET_USER_PROFILE, async (profile: UserProfile) => {
      await this.storageService?.addUserProfile(profile)
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
    this.storageService.channels.on(StorageEvents.FILE_UPLOADED, (payload: UploadFilePayload) => {
      this.serverIoProvider.io.emit(SocketEvents.FILE_UPLOADED, payload)
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
  }
}
