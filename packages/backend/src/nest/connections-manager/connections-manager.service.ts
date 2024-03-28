import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { Crypto } from '@peculiar/webcrypto'
import { Agent } from 'https'
import fs from 'fs'
import path from 'path'
import { peerIdFromKeys } from '@libp2p/peer-id'
import { setEngine, CryptoEngine } from 'pkijs'
import { EventEmitter } from 'events'
import getPort from 'get-port'
import PeerId from 'peer-id'
import { getLibp2pAddressesFromCsrs, removeFilesFromDir } from '../common/utils'

import {
  GetMessagesPayload,
  ChannelMessageIdsResponse,
  type DeleteChannelResponse,
  ChannelsReplicatedPayload,
  Community,
  CommunityId,
  ConnectionProcessInfo,
  CreateChannelPayload,
  CreateChannelResponse,
  DeleteFilesFromChannelSocketPayload,
  DownloadStatus,
  ErrorMessages,
  FileMetadata,
  MessagesLoadedPayload,
  InitCommunityPayload,
  NetworkDataPayload,
  NetworkInfo,
  NetworkStats,
  PushNotificationPayload,
  RegisterOwnerCertificatePayload,
  RemoveDownloadStatus,
  SendCertificatesResponse,
  SendMessagePayload,
  ChannelSubscribedPayload,
  SocketActionTypes,
  StorePeerListPayload,
  UploadFilePayload,
  PeerId as PeerIdType,
  SaveCSRPayload,
  CommunityMetadata,
  type PermsData,
  type UserProfile,
  type UserProfilesStoredEvent,
  CreateNetworkPayload,
  CommunityOwnership,
} from '@quiet/types'
import { CONFIG_OPTIONS, QUIET_DIR, SERVER_IO_PROVIDER, SOCKS_PROXY_AGENT } from '../const'
import { ConfigOptions, GetPorts, ServerIoProviderTypes } from '../types'
import { SocketService } from '../socket/socket.service'
import { RegistrationService } from '../registration/registration.service'
import { LocalDbService } from '../local-db/local-db.service'
import { StorageService } from '../storage/storage.service'
import { ServiceState, TorInitState } from './connections-manager.types'
import { Libp2pService } from '../libp2p/libp2p.service'
import { Tor } from '../tor/tor.service'
import { LocalDBKeys } from '../local-db/local-db.types'
import { Libp2pEvents, Libp2pNodeParams } from '../libp2p/libp2p.types'
import { RegistrationEvents } from '../registration/registration.types'
import { StorageEvents } from '../storage/storage.types'
import { LazyModuleLoader } from '@nestjs/core'
import Logger from '../common/logger'
import { emitError } from '../socket/socket.errors'
import { isPSKcodeValid, p2pAddressesToPairs } from '@quiet/common'
import { ServerProxyService } from '../storageServerProxy/storageServerProxy.service'
import { ServerStoredCommunityMetadata } from '../storageServerProxy/storageServerProxy.types'

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
    private readonly storageServerProxyService: ServerProxyService,
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
    this.attachRegistrationListeners()
    this.attachTorEventsListeners()
    this.attachStorageListeners()

    if (this.localDbService.getStatus() === 'closed') {
      await this.localDbService.open()
    }

    if (this.configOptions.torControlPort) {
      console.log('launch 1')
      await this.launchCommunityFromStorage()
    }
  }

  public async launchCommunityFromStorage() {
    this.logger('launchCommunityFromStorage')

    const community: InitCommunityPayload = await this.localDbService.get(LocalDBKeys.COMMUNITY)
    this.logger('launchCommunityFromStorage - community peers', community?.peers)
    if (community) {
      const sortedPeers = await this.localDbService.getSortedPeers(community.peers)
      this.logger('launchCommunityFromStorage - sorted peers', sortedPeers)
      if (sortedPeers.length > 0) {
        community.peers = sortedPeers
      }
      await this.localDbService.put(LocalDBKeys.COMMUNITY, community)
      if ([ServiceState.LAUNCHING, ServiceState.LAUNCHED].includes(this.communityState)) return
      this.communityState = ServiceState.LAUNCHING
      await this.launchCommunity(community)
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

    return network
  }

  private async generatePSK() {
    const pskBase64 = Libp2pService.generateLibp2pPSK().psk
    await this.localDbService.put(LocalDBKeys.PSK, pskBase64)
    this.logger('Generated Libp2p PSK')
    this.serverIoProvider.io.emit(SocketActionTypes.LIBP2P_PSK_STORED, { psk: pskBase64 })
  }

  public async createCommunity(payload: InitCommunityPayload) {
    this.logger('Creating community: peers:', payload.peers)

    await this.generatePSK()

    await this.launchCommunity(payload)
    this.logger(`Created and launched community ${payload.id}`)
    this.serverIoProvider.io.emit(SocketActionTypes.COMMUNITY_CREATED, { id: payload.id })
  }

  public async launchCommunity(payload: InitCommunityPayload) {
    this.logger('Launching community: peers:', payload.peers)
    this.communityState = ServiceState.LAUNCHING

    // TODO: Move community creation to the backend so that
    // launchCommunity/createCommunity return a Community object to the
    // frontend. Also deprecate the COMMUNITY/PSK/OWNER_ORBIT_DB_IDENTITY
    // IndexDB keys in favor of COMMUNITIES/CURRENT_COMMUNITY_ID/IDENTITIES,
    // mirroring the frontend state so that we can easily move things from the
    // frontend to the backend.
    const communityData: InitCommunityPayload = await this.localDbService.get(LocalDBKeys.COMMUNITY)
    if (!communityData) {
      await this.localDbService.put(LocalDBKeys.COMMUNITY, payload)
    }

    const psk = payload.psk
    if (psk) {
      this.logger('Launching community: received Libp2p PSK')
      if (!isPSKcodeValid(psk)) {
        this.logger.error('Launching community: received Libp2p PSK is not valid')
        emitError(this.serverIoProvider.io, {
          type: SocketActionTypes.LAUNCH_COMMUNITY,
          message: ErrorMessages.NETWORK_SETUP_FAILED,
          community: payload.id,
        })
        return
      }
      await this.localDbService.put(LocalDBKeys.PSK, psk)
    }

    const ownerOrbitDbIdentity = payload.ownerOrbitDbIdentity
    if (ownerOrbitDbIdentity) {
      this.logger("Creating network: received owner's OrbitDB identity")
      await this.localDbService.putOwnerOrbitDbIdentity(ownerOrbitDbIdentity)
    }

    try {
      await this.launch(payload)
    } catch (e) {
      this.logger(`Couldn't launch community for peer ${payload.peerId.id}.`, e)
      emitError(this.serverIoProvider.io, {
        type: SocketActionTypes.LAUNCH_COMMUNITY,
        message: ErrorMessages.COMMUNITY_LAUNCH_FAILED,
        community: payload.id,
        trace: e.stack,
      })
      return
    }

    this.logger(`Launched community ${payload.id}`)

    this.serverIoProvider.io.emit(SocketActionTypes.CONNECTION_PROCESS_INFO, ConnectionProcessInfo.COMMUNITY_LAUNCHED)

    this.communityId = payload.id
    this.communityState = ServiceState.LAUNCHED

    console.log('Hunting for heisenbug: Backend initialized community and sent event to state manager')

    // Unblock websocket endpoints
    this.socketService.resolveReadyness()

    this.serverIoProvider.io.emit(SocketActionTypes.COMMUNITY_LAUNCHED, { id: payload.id })
  }

  public async spawnTorHiddenService(payload: InitCommunityPayload): Promise<string> {
    this.logger(`Spawning hidden service for community ${payload.id}, peer: ${payload.peerId.id}`)
    this.serverIoProvider.io.emit(
      SocketActionTypes.CONNECTION_PROCESS_INFO,
      ConnectionProcessInfo.SPAWNING_HIDDEN_SERVICE
    )
    return await this.tor.spawnHiddenService({
      targetPort: this.ports.libp2pHiddenService,
      privKey: payload.hiddenService.privateKey,
    })
  }

  public async launch(payload: InitCommunityPayload) {
    this.logger(`Launching community ${payload.id}: peer: ${payload.peerId.id}`)

    const onionAddress = await this.spawnTorHiddenService(payload)

    const { Libp2pModule } = await import('../libp2p/libp2p.module')
    const moduleRef = await this.lazyModuleLoader.load(() => Libp2pModule)
    const { Libp2pService } = await import('../libp2p/libp2p.service')
    const lazyService = moduleRef.get(Libp2pService)
    this.libp2pService = lazyService

    const restoredRsa = await PeerId.createFromJSON(payload.peerId)
    const _peerId = await peerIdFromKeys(restoredRsa.marshalPubKey(), restoredRsa.marshalPrivKey())

    let peers = payload.peers
    this.logger(`Launching community ${payload.id}: payload peers: ${peers}`)
    if (!peers || peers.length === 0) {
      peers = [this.libp2pService.createLibp2pAddress(onionAddress, _peerId.toString())]
    }

    const pskValue: string = await this.localDbService.get(LocalDBKeys.PSK)
    if (!pskValue) {
      throw new Error('No psk in local db')
    }
    this.logger(`Launching community ${payload.id}: retrieved Libp2p PSK`)

    const libp2pPSK = Libp2pService.generateLibp2pPSK(pskValue).fullKey
    const params: Libp2pNodeParams = {
      peerId: _peerId,
      listenAddresses: [this.libp2pService.createLibp2pListenAddress(onionAddress)],
      agent: this.socksProxyAgent,
      localAddress: this.libp2pService.createLibp2pAddress(onionAddress, _peerId.toString()),
      targetPort: this.ports.libp2pHiddenService,
      peers,
      psk: libp2pPSK,
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
    await this.storageService.init(_peerId)
    // We can use Nest for dependency injection, but I think since the
    // registration service depends on the storage service being
    // initialized, this is helpful to manually inject the storage
    // service for now. Both object construction and object
    // initialization need to happen in order based on dependencies.
    await this.registrationService.init(this.storageService)
    this.logger('storage initialized')

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

  private attachRegistrationListeners() {
    this.registrationService.on(SocketActionTypes.OWNER_CERTIFICATE_ISSUED, payload => {
      this.serverIoProvider.io.emit(SocketActionTypes.OWNER_CERTIFICATE_ISSUED, payload)
    })
    this.registrationService.on(RegistrationEvents.ERROR, payload => {
      emitError(this.serverIoProvider.io, payload)
    })
  }

  private attachSocketServiceListeners() {
    // Community
    this.socketService.on(SocketActionTypes.CONNECTION, async () => {
      // Update Frontend with Initialized Communities
      if (this.communityId) {
        console.log('Hunting for heisenbug: Backend initialized community and sent event to state manager')
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
      async (communityId: string, callback: (response?: NetworkInfo) => void) => {
        this.logger(`socketService - ${SocketActionTypes.CREATE_NETWORK}`)
        callback(await this.createNetwork(communityId))
      }
    )
    this.socketService.on(SocketActionTypes.CREATE_COMMUNITY, async (args: InitCommunityPayload) => {
      await this.createCommunity(args)
    })
    this.socketService.on(SocketActionTypes.LAUNCH_COMMUNITY, async (args: InitCommunityPayload) => {
      this.logger(`socketService - ${SocketActionTypes.LAUNCH_COMMUNITY}`)
      if ([ServiceState.LAUNCHING, ServiceState.LAUNCHED].includes(this.communityState)) return
      this.communityState = ServiceState.LAUNCHING
      await this.launchCommunity(args)
    })
    this.socketService.on(
      SocketActionTypes.SET_COMMUNITY_METADATA,
      async (payload: CommunityMetadata, callback: (response?: CommunityMetadata) => void) => {
        const meta = await this.storageService?.updateCommunityMetadata(payload)
        callback(meta)
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
    this.socketService.on(
      SocketActionTypes.REGISTER_OWNER_CERTIFICATE,
      async (args: RegisterOwnerCertificatePayload) => {
        await this.registrationService.registerOwnerCertificate(args)
      }
    )
    // TODO: Save community CA data in LevelDB. Perhaps save the
    // entire Community type in LevelDB. We can probably do this once
    // when creating the community.
    this.socketService.on(SocketActionTypes.SET_COMMUNITY_CA_DATA, async (payload: PermsData) => {
      this.logger(`socketService - ${SocketActionTypes.SET_COMMUNITY_CA_DATA}`)
      this.registrationService.setPermsData(payload)
    })

    this.socketService.on(
      SocketActionTypes.DOWNLOAD_INVITE_DATA,
      async (payload: { cid: string; serverAddress: string }, callback: (response: CreateNetworkPayload) => void) => {
        this.logger(`socketService - ${SocketActionTypes.DOWNLOAD_INVITE_DATA}`)
        this.storageServerProxyService.setServerAddress(payload.serverAddress)
        let downloadedData: ServerStoredCommunityMetadata
        try {
          downloadedData = await this.storageServerProxyService.downloadData(payload.cid)
        } catch (e) {
          this.logger.error(`Downloading community data failed`, e)
          emitError(this.serverIoProvider.io, {
            type: SocketActionTypes.DOWNLOAD_INVITE_DATA,
            message: ErrorMessages.STORAGE_SERVER_CONNECTION_FAILED,
          })
          return
        }

        const createNetworkPayload: CreateNetworkPayload = {
          ownership: CommunityOwnership.User,
          peers: p2pAddressesToPairs(downloadedData.peerList),
          psk: downloadedData.psk,
          ownerOrbitDbIdentity: downloadedData.ownerOrbitDbIdentity,
        }
        callback(createNetworkPayload)
      }
    )

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
    this.storageService.on(StorageEvents.UPDATE_PEERS_LIST, (payload: StorePeerListPayload) => {
      this.serverIoProvider.io.emit(SocketActionTypes.PEER_LIST, payload)
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
      this.serverIoProvider.io.emit(SocketActionTypes.COMMUNITY_METADATA_STORED, meta)
    })
    this.storageService.on(StorageEvents.USER_PROFILES_STORED, (payload: UserProfilesStoredEvent) => {
      this.serverIoProvider.io.emit(SocketActionTypes.USER_PROFILES_STORED, payload)
    })
  }
}
