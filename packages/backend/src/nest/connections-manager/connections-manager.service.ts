import { peerIdFromKeys } from '@libp2p/peer-id'
import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { Crypto } from '@peculiar/webcrypto'
import { EventEmitter } from 'events'
import fs from 'fs'
import getPort from 'get-port'
import { Agent } from 'https'
import path from 'path'
import PeerId from 'peer-id'
import { CryptoEngine, setEngine } from 'pkijs'
import { getLibp2pAddressesFromCsrs, removeFilesFromDir } from '../common/utils'

import { LazyModuleLoader } from '@nestjs/core'
import { createLibp2pAddress, isPSKcodeValid } from '@quiet/common'
import { CertFieldsTypes, getCertFieldValue, loadCertificate } from '@quiet/identity'
import {
  ChannelMessageIdsResponse,
  ChannelSubscribedPayload,
  ChannelsReplicatedPayload,
  Community,
  CommunityMetadata,
  ConnectionProcessInfo,
  CreateChannelPayload,
  CreateChannelResponse,
  DeleteFilesFromChannelSocketPayload,
  DownloadStatus,
  ErrorMessages,
  FileMetadata,
  GetMessagesPayload,
  InitCommunityPayload,
  InvitationDataV2,
  InvitationDataVersion,
  MessagesLoadedPayload,
  NetworkDataPayload,
  NetworkInfo,
  NetworkStats,
  PushNotificationPayload,
  RemoveDownloadStatus,
  SaveCSRPayload,
  SendCertificatesResponse,
  SendMessagePayload,
  SocketActionTypes,
  UploadFilePayload,
  type DeleteChannelResponse,
  type SavedOwnerCertificatePayload,
  type UserProfile,
  type UserProfilesStoredEvent,
} from '@quiet/types'
import Logger from '../common/logger'
import { CONFIG_OPTIONS, QUIET_DIR, SERVER_IO_PROVIDER, SOCKS_PROXY_AGENT } from '../const'
import { Libp2pService } from '../libp2p/libp2p.service'
import { Libp2pEvents, Libp2pNodeParams } from '../libp2p/libp2p.types'
import { LocalDbService } from '../local-db/local-db.service'
import { LocalDBKeys } from '../local-db/local-db.types'
import { RegistrationService } from '../registration/registration.service'
import { RegistrationEvents } from '../registration/registration.types'
import { emitError } from '../socket/socket.errors'
import { SocketService } from '../socket/socket.service'
import { StorageService } from '../storage/storage.service'
import { StorageEvents } from '../storage/storage.types'
import { StorageServiceClient } from '../storageServiceClient/storageServiceClient.service'
import { ServerStoredCommunityMetadata } from '../storageServiceClient/storageServiceClient.types'
import { Tor } from '../tor/tor.service'
import { ConfigOptions, GetPorts, ServerIoProviderTypes } from '../types'
import { ServiceState, TorInitState } from './connections-manager.types'

@Injectable()
export class ConnectionsManagerService extends EventEmitter implements OnModuleInit {
  public communityId: string
  public communityState: ServiceState
  public libp2pService: Libp2pService
  private ports: GetPorts
  isTorInit: TorInitState = TorInitState.NOT_STARTED

  private readonly logger = Logger(ConnectionsManagerService.name)
  constructor(
    @Inject(SERVER_IO_PROVIDER) public readonly serverIoProvider: ServerIoProviderTypes,
    @Inject(CONFIG_OPTIONS) public configOptions: ConfigOptions,
    @Inject(QUIET_DIR) public readonly quietDir: string,
    @Inject(SOCKS_PROXY_AGENT) public readonly socksProxyAgent: Agent,
    private readonly socketService: SocketService,
    private readonly registrationService: RegistrationService,
    private readonly storageServerProxyService: StorageServiceClient,
    private readonly localDbService: LocalDbService,
    private readonly storageService: StorageService,
    private readonly tor: Tor,
    private readonly lazyModuleLoader: LazyModuleLoader
  ) {
    super()
  }

  async onModuleInit() {
    process.on('unhandledRejection', error => {
      console.error(error)
      throw new Error()
    })
    // process.on('SIGINT', function () {
    //   // This is not graceful even in a single percent. we must close services first, not just kill process %
    //   // this.logger('\nGracefully shutting down from SIGINT (Ctrl-C)')
    //   process.exit(0)
    // })
    const webcrypto = new Crypto()
    // @ts-ignore
    global.crypto = webcrypto

    setEngine(
      'newEngine',
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
    console.log('init')
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
    // This is related to a specific migration, perhaps there is a way to
    // encapsulate this in LocalDbService.
    const keys = [LocalDBKeys.CURRENT_COMMUNITY_ID, LocalDBKeys.COMMUNITIES]
    const keysRequired: string[] = []

    for (const key of keys) {
      if (!(await this.localDbService.exists(key))) {
        keysRequired.push(key)
      }
    }

    this.socketService.on(SocketActionTypes.LOAD_MIGRATION_DATA, async (data: Record<string, any>) => {
      this.logger('Migrating LevelDB')
      await this.localDbService.load(data)
      onDataReceived()
    })

    // Only require migration data for existing communities. We can tell because
    // they are using the deprecated COMMUNITY key in LevelDB. This is related
    // to a specific migration. Perhaps we want a more general purpose migration
    // mechanism, like a table to hold migrations that have already been
    // applied.
    if ((await this.localDbService.exists(LocalDBKeys.COMMUNITY)) && keysRequired.length > 0) {
      this.logger('Migration data required:', keysRequired)
      this.serverIoProvider.io.emit(SocketActionTypes.MIGRATION_DATA_REQUIRED, keysRequired)
      await dataReceivedPromise
    } else {
      this.logger('Nothing to migrate')
    }
  }

  public async launchCommunityFromStorage() {
    this.logger('Launching community from storage')

    const community = await this.localDbService.getCurrentCommunity()
    // TODO: Revisit this when we move the Identity model to the backend, since
    // this network data lives in that model.
    const network = await this.localDbService.getNetworkInfo()

    if (community && network) {
      const sortedPeers = await this.localDbService.getSortedPeers(community.peerList)
      this.logger('launchCommunityFromStorage - sorted peers', sortedPeers)
      if (sortedPeers.length > 0) {
        community.peerList = sortedPeers
      }
      await this.localDbService.setCommunity(community)

      await this.launchCommunity({ community, network })
    }
  }

  public async closeAllServices(options: { saveTor: boolean } = { saveTor: false }) {
    if (this.tor && !options.saveTor) {
      await this.tor.kill()
    }
    if (this.storageService) {
      this.logger('Stopping orbitdb')
      await this.storageService?.stopOrbitDb()
    }
    if (this.serverIoProvider?.io) {
      this.logger('Closing socket server')
      this.serverIoProvider.io.close()
    }
    if (this.localDbService) {
      this.logger('Closing local storage')
      await this.localDbService.close()
    }
    if (this.libp2pService) {
      this.logger('Stopping libp2p')
      await this.libp2pService.close()
    }
  }

  public closeSocket() {
    this.serverIoProvider.io.close()
  }

  // This method is only used on iOS through rn-bridge for reacting on lifecycle changes
  public async openSocket() {
    await this.socketService.init()
  }

  public async leaveCommunity() {
    this.tor.resetHiddenServices()
    this.closeSocket()
    await this.localDbService.purge()
    await this.closeAllServices({ saveTor: true })
    await this.purgeData()
    await this.resetState()
    await this.localDbService.open()
    await this.socketService.init()
  }

  async resetState() {
    this.communityId = ''
    this.ports = { ...this.ports, libp2pHiddenService: await getPort() }
    this.communityState = ServiceState.DEFAULT
  }

  public async purgeData() {
    this.logger('Purging community data')
    const dirsToRemove = fs
      .readdirSync(this.quietDir)
      .filter(
        i =>
          i.startsWith('Ipfs') || i.startsWith('OrbitDB') || i.startsWith('backendDB') || i.startsWith('Local Storage')
      )
    for (const dir of dirsToRemove) {
      removeFilesFromDir(path.join(this.quietDir, dir))
    }
  }

  public async getNetwork(): Promise<NetworkInfo> {
    const hiddenService = await this.tor.createNewHiddenService({ targetPort: this.ports.libp2pHiddenService })
    await this.tor.destroyHiddenService(hiddenService.onionAddress.split('.')[0])

    // TODO: Do we want to create the PeerId here? It doesn't necessarily have
    // anything to do with Tor.
    const peerId: PeerId = await PeerId.create()
    const peerIdJson = peerId.toJSON()
    this.logger(`Created network for peer ${peerId.toString()}. Address: ${hiddenService.onionAddress}`)

    return {
      hiddenService,
      peerId: peerIdJson,
    }
  }

  public async createNetwork(communityId: string): Promise<NetworkInfo | undefined> {
    let network: NetworkInfo

    try {
      network = await this.getNetwork()
    } catch (e) {
      this.logger.error(`Creating network for community ${communityId} failed`, e)
      emitError(this.serverIoProvider.io, {
        type: SocketActionTypes.CREATE_NETWORK,
        message: ErrorMessages.NETWORK_SETUP_FAILED,
        community: communityId,
      })
      return
    }

    // TODO: Should we save this network info in LevelDB at this point?
    return network
  }

  public async createCommunity(payload: InitCommunityPayload): Promise<Community | undefined> {
    this.logger('Creating community', payload.id)

    if (!payload.CA || !payload.rootCa) {
      this.logger.error('CA and rootCa are required to create community')
      return
    }

    if (!payload.ownerCsr) {
      this.logger.error('ownerCsr is required to create community')
      return
    }

    const psk = Libp2pService.generateLibp2pPSK().psk
    let ownerCertResult: SavedOwnerCertificatePayload

    try {
      this.emit(SocketActionTypes.CONNECTION_PROCESS_INFO, ConnectionProcessInfo.REGISTERING_OWNER_CERTIFICATE)
      ownerCertResult = await this.registrationService.registerOwnerCertificate({
        communityId: payload.id,
        userCsr: payload.ownerCsr,
        permsData: {
          certificate: payload.CA.rootCertString,
          privKey: payload.CA.rootKeyString,
        },
      })
    } catch (e) {
      this.logger.error('Failed to register owner certificate')
      return
    }

    const localAddress = createLibp2pAddress(payload.hiddenService.onionAddress, payload.peerId.id)

    let community: Community = {
      id: payload.id,
      name: payload.name,
      CA: payload.CA,
      rootCa: payload.rootCa,
      peerList: [localAddress],
      ownerCertificate: ownerCertResult.network.certificate,
      psk: psk,
    }

    const network = {
      hiddenService: payload.hiddenService,
      peerId: payload.peerId,
    }

    await this.localDbService.setCommunity(community)
    await this.localDbService.setCurrentCommunityId(community.id)
    // TODO: Revisit this when we move the Identity model to the backend, since
    // this network data lives in that model.
    await this.localDbService.setNetworkInfo(network)

    await this.launchCommunity({ community, network })

    const meta = await this.storageService.updateCommunityMetadata({
      id: community.id,
      rootCa: community.rootCa as string,
      ownerCertificate: community.ownerCertificate as string,
    })
    const currentCommunity = await this.localDbService.getCurrentCommunity()

    if (meta && currentCommunity) {
      community = {
        ...currentCommunity,
        ownerOrbitDbIdentity: meta.ownerOrbitDbIdentity,
      }
      await this.localDbService.setCommunity(community)
    }

    this.logger(`Created and launched community ${community.id}`)

    return community
  }

  public async downloadCommunityData(inviteData: InvitationDataV2) {
    this.logger('Downloading invite data', inviteData)
    this.storageServerProxyService.setServerAddress(inviteData.serverAddress)
    let downloadedData: ServerStoredCommunityMetadata
    try {
      downloadedData = await this.storageServerProxyService.downloadData(inviteData.cid)
    } catch (e) {
      this.logger.error(`Downloading community data failed`, e)
      return
    }
    return {
      psk: downloadedData.psk,
      peers: downloadedData.peerList,
      ownerOrbitDbIdentity: downloadedData.ownerOrbitDbIdentity,
    }
  }

  public async joinCommunity(payload: InitCommunityPayload): Promise<Community | undefined> {
    this.logger('Joining community: peers:', payload.peers)
    let metadata = {
      psk: payload.psk,
      peers: payload.peers,
      ownerOrbitDbIdentity: payload.ownerOrbitDbIdentity,
    }

    const inviteData = payload.inviteData
    if (inviteData) {
      this.logger(`Joining community: inviteData version: ${inviteData.version}`)
      switch (inviteData.version) {
        case InvitationDataVersion.v2:
          const downloadedData = await this.downloadCommunityData(inviteData)
          if (!downloadedData) {
            emitError(this.serverIoProvider.io, {
              type: SocketActionTypes.LAUNCH_COMMUNITY,
              message: ErrorMessages.STORAGE_SERVER_CONNECTION_FAILED,
            })
            return
          }
          metadata = downloadedData
          break
      }
    }

    if (!metadata.peers || metadata.peers.length === 0) {
      this.logger.error('Joining community: Peers required')
      return
    }

    if (!metadata.psk || !isPSKcodeValid(metadata.psk)) {
      this.logger.error('Joining community: Libp2p PSK is not valid')
      emitError(this.serverIoProvider.io, {
        type: SocketActionTypes.LAUNCH_COMMUNITY,
        message: ErrorMessages.NETWORK_SETUP_FAILED,
        community: payload.id,
      })
      return
    }

    if (!metadata.ownerOrbitDbIdentity) {
      this.logger.error('Joining community: ownerOrbitDbIdentity is not valid')
      emitError(this.serverIoProvider.io, {
        type: SocketActionTypes.LAUNCH_COMMUNITY,
        message: ErrorMessages.NETWORK_SETUP_FAILED,
        community: payload.id,
      })
      return
    }

    const localAddress = createLibp2pAddress(payload.hiddenService.onionAddress, payload.peerId.id)

    const community = {
      id: payload.id,
      peerList: [...new Set([localAddress, ...metadata.peers])],
      psk: metadata.psk,
      ownerOrbitDbIdentity: metadata.ownerOrbitDbIdentity,
      inviteData,
    }

    const network = {
      hiddenService: payload.hiddenService,
      peerId: payload.peerId,
    }

    await this.localDbService.setCommunity(community)
    await this.localDbService.setCurrentCommunityId(community.id)
    // TODO: Revisit this when we move the Identity model to the backend, since
    // this network data lives in that model.
    await this.localDbService.setNetworkInfo(network)

    await this.launchCommunity({ community, network })
    this.logger(`Joined and launched community ${community.id}`)

    return community
  }

  public async launchCommunity({ community, network }: { community: Community; network: NetworkInfo }) {
    if ([ServiceState.LAUNCHING, ServiceState.LAUNCHED].includes(this.communityState)) {
      this.logger.error(
        'Cannot launch community more than once.' +
          ' Community has already been launched or is currently being launched.'
      )
      return
    }
    this.communityState = ServiceState.LAUNCHING

    try {
      await this.launch({ community, network })
    } catch (e) {
      this.logger(`Couldn't launch community for peer ${network.peerId.id}.`, e)
      emitError(this.serverIoProvider.io, {
        type: SocketActionTypes.LAUNCH_COMMUNITY,
        message: ErrorMessages.COMMUNITY_LAUNCH_FAILED,
        community: community.id,
        trace: e.stack,
      })
      return
    }

    this.logger(`Launched community ${community.id}`)

    this.serverIoProvider.io.emit(SocketActionTypes.CONNECTION_PROCESS_INFO, ConnectionProcessInfo.COMMUNITY_LAUNCHED)

    this.communityId = community.id
    this.communityState = ServiceState.LAUNCHED

    // Unblock websocket endpoints
    this.socketService.resolveReadyness()

    this.serverIoProvider.io.emit(SocketActionTypes.COMMUNITY_LAUNCHED, { id: community.id })
  }

  public async spawnTorHiddenService(communityId: string, network: NetworkInfo): Promise<string> {
    this.logger(`Spawning hidden service for community ${communityId}, peer: ${network.peerId.id}`)
    this.serverIoProvider.io.emit(
      SocketActionTypes.CONNECTION_PROCESS_INFO,
      ConnectionProcessInfo.SPAWNING_HIDDEN_SERVICE
    )
    return await this.tor.spawnHiddenService({
      targetPort: this.ports.libp2pHiddenService,
      privKey: network.hiddenService.privateKey,
    })
  }

  public async launch({ community, network }: { community: Community; network: NetworkInfo }) {
    this.logger(`Launching community ${community.id}: peer: ${network.peerId.id}`)

    const onionAddress = await this.spawnTorHiddenService(community.id, network)

    const { Libp2pModule } = await import('../libp2p/libp2p.module')
    const moduleRef = await this.lazyModuleLoader.load(() => Libp2pModule)
    const { Libp2pService } = await import('../libp2p/libp2p.service')
    const lazyService = moduleRef.get(Libp2pService)
    this.libp2pService = lazyService

    const restoredRsa = await PeerId.createFromJSON(network.peerId)
    const peerId = await peerIdFromKeys(restoredRsa.marshalPubKey(), restoredRsa.marshalPrivKey())

    const peers = community.peerList
    this.logger(`Launching community ${community.id}: payload peers: ${peers}`)

    const params: Libp2pNodeParams = {
      peerId,
      listenAddresses: [this.libp2pService.createLibp2pListenAddress(onionAddress)],
      agent: this.socksProxyAgent,
      localAddress: this.libp2pService.createLibp2pAddress(onionAddress, peerId.toString()),
      targetPort: this.ports.libp2pHiddenService,
      peers: peers ? peers.slice(1) : [],
      psk: Libp2pService.generateLibp2pPSK(community.psk).fullKey,
    }
    await this.libp2pService.createInstance(params)

    // Libp2p event listeners
    this.libp2pService.on(Libp2pEvents.PEER_CONNECTED, (payload: { peers: string[] }) => {
      this.serverIoProvider.io.emit(SocketActionTypes.PEER_CONNECTED, payload)
    })

    this.libp2pService.on(Libp2pEvents.PEER_DISCONNECTED, async (payload: NetworkDataPayload) => {
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
      // BARTEK: Potentially obsolete to send this to state-manager
      this.serverIoProvider.io.emit(SocketActionTypes.PEER_DISCONNECTED, payload)
    })

    await this.storageService.init(peerId)
    // We can use Nest for dependency injection, but I think since the
    // registration service depends on the storage service being
    // initialized, this is helpful to manually inject the storage
    // service for now. Both object construction and object
    // initialization need to happen in order based on dependencies.
    await this.registrationService.init(this.storageService)

    if (community.CA) {
      this.registrationService.setPermsData({
        certificate: community.CA.rootCertString,
        privKey: community.CA.rootKeyString,
      })
    }

    this.logger('Storage initialized')

    this.serverIoProvider.io.emit(
      SocketActionTypes.CONNECTION_PROCESS_INFO,
      ConnectionProcessInfo.CONNECTING_TO_COMMUNITY
    )
  }

  private attachTorEventsListeners() {
    this.logger('attachTorEventsListeners')

    this.tor.on(SocketActionTypes.CONNECTION_PROCESS_INFO, data => {
      this.serverIoProvider.io.emit(SocketActionTypes.CONNECTION_PROCESS_INFO, data)
    })
    this.socketService.on(SocketActionTypes.CONNECTION_PROCESS_INFO, data => {
      this.serverIoProvider.io.emit(SocketActionTypes.CONNECTION_PROCESS_INFO, data)
    })
  }

  private attachSocketServiceListeners() {
    // Community
    this.socketService.on(SocketActionTypes.CONNECTION, async () => {
      // Update Frontend with Initialized Communities
      if (this.communityId) {
        this.serverIoProvider.io.emit(SocketActionTypes.COMMUNITY_LAUNCHED, { id: this.communityId })
        console.log('this.libp2pService.connectedPeers', this.libp2pService.connectedPeers)
        console.log('this.libp2pservice', this.libp2pService)
        this.serverIoProvider.io.emit(
          SocketActionTypes.CONNECTED_PEERS,
          Array.from(this.libp2pService.connectedPeers.keys())
        )
        this.serverIoProvider.io.emit(SocketActionTypes.CERTIFICATES_STORED, {
          certificates: await this.storageService?.loadAllCertificates(),
        })
        await this.storageService?.loadAllChannels()
      }
    })
    this.socketService.on(
      SocketActionTypes.CREATE_NETWORK,
      async (communityId: string, callback: (response: NetworkInfo | undefined) => void) => {
        this.logger(`socketService - ${SocketActionTypes.CREATE_NETWORK}`)
        callback(await this.createNetwork(communityId))
      }
    )
    this.socketService.on(
      SocketActionTypes.CREATE_COMMUNITY,
      async (args: InitCommunityPayload, callback: (response: Community | undefined) => void) => {
        this.logger(`socketService - ${SocketActionTypes.CREATE_COMMUNITY}`)
        callback(await this.createCommunity(args))
      }
    )
    // TODO: Rename to JOIN_COMMUNITY?
    this.socketService.on(
      SocketActionTypes.LAUNCH_COMMUNITY,
      async (args: InitCommunityPayload, callback: (response: Community | undefined) => void) => {
        this.logger(`socketService - ${SocketActionTypes.LAUNCH_COMMUNITY}`)
        callback(await this.joinCommunity(args))
      }
    )
    this.socketService.on(SocketActionTypes.LEAVE_COMMUNITY, async () => {
      await this.leaveCommunity()
    })

    // Username registration
    this.socketService.on(SocketActionTypes.ADD_CSR, async (payload: SaveCSRPayload) => {
      this.logger(`socketService - ${SocketActionTypes.ADD_CSR}`)
      await this.storageService?.saveCSR(payload)
    })

    // Public Channels
    this.socketService.on(
      SocketActionTypes.CREATE_CHANNEL,
      async (args: CreateChannelPayload, callback: (response?: CreateChannelResponse) => void) => {
        callback(await this.storageService?.subscribeToChannel(args.channel))
      }
    )
    this.socketService.on(
      SocketActionTypes.DELETE_CHANNEL,
      async (
        payload: { channelId: string; ownerPeerId: string },
        callback: (response: DeleteChannelResponse) => void
      ) => {
        callback(await this.storageService?.deleteChannel(payload))
      }
    )
    this.socketService.on(
      SocketActionTypes.DELETE_FILES_FROM_CHANNEL,
      async (payload: DeleteFilesFromChannelSocketPayload) => {
        this.logger(`socketService - ${SocketActionTypes.DELETE_FILES_FROM_CHANNEL}`, payload)
        await this.storageService?.deleteFilesFromChannel(payload)
        // await this.deleteFilesFromTemporaryDir() //crashes on mobile, will be fixes in next versions
      }
    )
    this.socketService.on(SocketActionTypes.SEND_MESSAGE, async (args: SendMessagePayload) => {
      await this.storageService?.sendMessage(args.message)
    })
    this.socketService.on(
      SocketActionTypes.GET_MESSAGES,
      async (payload: GetMessagesPayload, callback: (response?: MessagesLoadedPayload) => void) => {
        callback(await this.storageService?.getMessages(payload.channelId, payload.ids))
      }
    )

    // Files
    this.socketService.on(SocketActionTypes.DOWNLOAD_FILE, async (metadata: FileMetadata) => {
      await this.storageService?.downloadFile(metadata)
    })
    this.socketService.on(SocketActionTypes.UPLOAD_FILE, async (metadata: FileMetadata) => {
      await this.storageService?.uploadFile(metadata)
    })
    this.socketService.on(SocketActionTypes.FILE_UPLOADED, async (args: FileMetadata) => {
      await this.storageService?.uploadFile(args)
    })
    this.socketService.on(SocketActionTypes.CANCEL_DOWNLOAD, mid => {
      this.storageService?.cancelDownload(mid)
    })

    // System
    this.socketService.on(SocketActionTypes.CLOSE, async () => {
      await this.closeAllServices()
    })

    // User Profile
    this.socketService.on(SocketActionTypes.SET_USER_PROFILE, async (profile: UserProfile) => {
      await this.storageService?.addUserProfile(profile)
    })
  }

  private attachStorageListeners() {
    if (!this.storageService) return
    this.storageService.on(SocketActionTypes.CONNECTION_PROCESS_INFO, data => {
      this.serverIoProvider.io.emit(SocketActionTypes.CONNECTION_PROCESS_INFO, data)
    })
    this.storageService.on(StorageEvents.CERTIFICATES_STORED, (payload: SendCertificatesResponse) => {
      this.logger(`Storage - ${StorageEvents.CERTIFICATES_STORED}`)
      this.serverIoProvider.io.emit(SocketActionTypes.CERTIFICATES_STORED, payload)
    })
    this.storageService.on(StorageEvents.CHANNELS_STORED, (payload: ChannelsReplicatedPayload) => {
      this.serverIoProvider.io.emit(SocketActionTypes.CHANNELS_STORED, payload)
    })
    this.storageService.on(StorageEvents.MESSAGES_STORED, (payload: MessagesLoadedPayload) => {
      this.serverIoProvider.io.emit(SocketActionTypes.MESSAGES_STORED, payload)
    })
    this.storageService.on(StorageEvents.MESSAGE_IDS_STORED, (payload: ChannelMessageIdsResponse) => {
      if (payload.ids.length === 0) {
        return
      }
      this.serverIoProvider.io.emit(SocketActionTypes.MESSAGE_IDS_STORED, payload)
    })
    this.storageService.on(StorageEvents.CHANNEL_SUBSCRIBED, (payload: ChannelSubscribedPayload) => {
      this.serverIoProvider.io.emit(SocketActionTypes.CHANNEL_SUBSCRIBED, payload)
    })
    this.storageService.on(StorageEvents.REMOVE_DOWNLOAD_STATUS, (payload: RemoveDownloadStatus) => {
      this.serverIoProvider.io.emit(SocketActionTypes.REMOVE_DOWNLOAD_STATUS, payload)
    })
    this.storageService.on(StorageEvents.FILE_UPLOADED, (payload: UploadFilePayload) => {
      this.serverIoProvider.io.emit(SocketActionTypes.FILE_UPLOADED, payload)
    })
    this.storageService.on(StorageEvents.DOWNLOAD_PROGRESS, (payload: DownloadStatus) => {
      this.serverIoProvider.io.emit(SocketActionTypes.DOWNLOAD_PROGRESS, payload)
    })
    this.storageService.on(StorageEvents.MESSAGE_MEDIA_UPDATED, (payload: FileMetadata) => {
      this.serverIoProvider.io.emit(SocketActionTypes.MESSAGE_MEDIA_UPDATED, payload)
    })
    this.storageService.on(StorageEvents.COMMUNITY_UPDATED, (payload: Community) => {
      this.serverIoProvider.io.emit(SocketActionTypes.COMMUNITY_UPDATED, payload)
    })
    this.storageService.on(StorageEvents.SEND_PUSH_NOTIFICATION, (payload: PushNotificationPayload) => {
      this.serverIoProvider.io.emit(SocketActionTypes.PUSH_NOTIFICATION, payload)
    })
    this.storageService.on(StorageEvents.CSRS_STORED, async (payload: { csrs: string[] }) => {
      this.logger(`Storage - ${StorageEvents.CSRS_STORED}`)
      this.libp2pService.emit(Libp2pEvents.DIAL_PEERS, await getLibp2pAddressesFromCsrs(payload.csrs))
      this.serverIoProvider.io.emit(SocketActionTypes.CSRS_STORED, payload)
      this.registrationService.emit(RegistrationEvents.REGISTER_USER_CERTIFICATE, payload)
    })
    this.storageService.on(StorageEvents.COMMUNITY_METADATA_STORED, async (meta: CommunityMetadata) => {
      this.logger(`Storage - ${StorageEvents.COMMUNITY_METADATA_STORED}: ${meta}`)
      const community = await this.localDbService.getCurrentCommunity()

      if (community) {
        const rootCaCert = loadCertificate(meta.rootCa)
        const communityName = getCertFieldValue(rootCaCert, CertFieldsTypes.commonName)

        if (!communityName) {
          this.logger.error(`Could not retrieve ${CertFieldsTypes.commonName} from CommunityMetadata.rootCa`)
        }

        const updatedCommunity = {
          ...community,
          name: communityName ?? undefined,
          rootCa: meta.rootCa,
          ownerCertificate: meta.ownerCertificate,
          ownerOrbitDbIdentity: meta.ownerOrbitDbIdentity,
        }
        await this.localDbService.setCommunity(updatedCommunity)

        this.serverIoProvider.io.emit(SocketActionTypes.COMMUNITY_UPDATED, updatedCommunity)
      }
    })
    this.storageService.on(StorageEvents.USER_PROFILES_STORED, (payload: UserProfilesStoredEvent) => {
      this.serverIoProvider.io.emit(SocketActionTypes.USER_PROFILES_STORED, payload)
    })
  }
}
