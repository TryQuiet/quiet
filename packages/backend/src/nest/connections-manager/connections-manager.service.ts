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
import { removeFilesFromDir } from '../common/utils'
import {
  AskForMessagesPayload,
  ChannelMessagesIdsResponse,
  ChannelsReplicatedPayload,
  Community,
  CommunityId,
  ConnectionProcessInfo,
  CreateChannelPayload,
  CreatedChannelResponse,
  DeleteFilesFromChannelSocketPayload,
  DownloadStatus,
  ErrorMessages,
  FileMetadata,
  IncomingMessages,
  InitCommunityPayload,
  LaunchRegistrarPayload,
  NetworkData,
  NetworkDataPayload,
  NetworkStats,
  PushNotificationPayload,
  RegisterOwnerCertificatePayload,
  RegisterUserCertificatePayload,
  RemoveDownloadStatus,
  ResponseCreateNetworkPayload,
  SaveCertificatePayload,
  SaveOwnerCertificatePayload,
  SendCertificatesResponse,
  SendMessagePayload,
  SetChannelSubscribedPayload,
  SocketActionTypes,
  StorePeerListPayload,
  UploadFilePayload,
  PeerId as PeerIdType,
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
import { emitError } from '../../socket/errors'
import { RegistrationEvents } from '../registration/registration.types'
import { InitStorageParams, StorageEvents } from '../storage/storage.types'
import { LazyModuleLoader } from '@nestjs/core'
import Logger from '../common/logger'

interface OpenServices {
  torControlPort?: any,
  socketIOPort?: any
}

@Injectable()
export class ConnectionsManagerService extends EventEmitter implements OnModuleInit {
  public communityId: string
  public communityState: ServiceState
  public registrarState: ServiceState
  private libp2pService: Libp2pService
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
    process.on('SIGINT', function () {
      // This is not graceful even in a single percent. we must close services first, not just kill process %
      // this.logger.log('\nGracefully shutting down from SIGINT (Ctrl-C)')
      process.exit(0)
    })
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

  private async init() {
    console.log('init')
    this.communityState = ServiceState.DEFAULT
    this.registrarState = ServiceState.DEFAULT
    await this.generatePorts()
    if (!this.configOptions.httpTunnelPort) {
      this.configOptions.httpTunnelPort = await getPort()
    }

    this.attachsocketServiceListeners()
    this.attachRegistrationListeners()
    this.attachTorEventsListeners()
    this.attachStorageListeners()

    // Libp2p event listeners
    this.on(Libp2pEvents.PEER_CONNECTED, (payload: { peers: string[] }) => {
      this.serverIoProvider.io.emit(SocketActionTypes.PEER_CONNECTED, payload)
    })
    this.on(Libp2pEvents.PEER_DISCONNECTED, async (payload: NetworkDataPayload) => {
      const peerPrevStats = await this.localDbService.find(LocalDBKeys.PEERS, payload.peer)
      const prev = peerPrevStats?.connectionTime || 0

      const peerStats: NetworkStats = {
        peerId: payload.peer,
        connectionTime: prev + payload.connectionDuration,
        lastSeen: payload.connectionDuration,
      }

      await this.localDbService.update(LocalDBKeys.PEERS, {
        [payload.peer]: peerStats,
      })
      // BARTEK: Potentially obsolete to send this to state-manager
      this.serverIoProvider.io.emit(SocketActionTypes.PEER_DISCONNECTED, payload)
    })

    if (this.configOptions.torControlPort) {
      console.log('launch 1')
      await this.launchCommunityFromStorage()
    }
  }

  public async launchCommunityFromStorage() {
    this.logger.log('launchCommunityFromStorage')

    const community: InitCommunityPayload = await this.localDbService.get(LocalDBKeys.COMMUNITY)
    console.log('launchCommunityFromStorage - community', community)
    if (community) {
      const sortedPeers = await this.localDbService.getSortedPeers(community.peers)
      if (sortedPeers.length > 0) {
        community.peers = sortedPeers
      }
      await this.localDbService.put(LocalDBKeys.COMMUNITY, community)
      if ([ServiceState.LAUNCHING, ServiceState.LAUNCHED].includes(this.communityState)) return
      this.communityState = ServiceState.LAUNCHING
    }
    const registrarData: LaunchRegistrarPayload = await this.localDbService.get(LocalDBKeys.REGISTRAR)
    if (registrarData) {
      if ([ServiceState.LAUNCHING, ServiceState.LAUNCHED].includes(this.registrarState)) return
      this.registrarState = ServiceState.LAUNCHING
    }
    if (community) {
      await this.launchCommunity(community)
    }
    if (registrarData) {
      await this.registrationService.launchRegistrar(registrarData)
    }
  }

  public async closeServices() {
    console.log('before closing services')
    await this.socketService.close()
    console.log('after closing services')
    if (this.localDbService) {
      this.logger.log('Closing local storage')
      await this.localDbService.close()
    }
    if (this.libp2pService.libp2pInstance) {
      this.logger.log('Stopping libp2p')
      await this.libp2pService.libp2pInstance.stop()
    }
    if (this.registrationService) {
      this.logger.log('Stopping registration service')
      await this.registrationService.stop()
    }
    if (this.storageService) {
      this.logger.log('Stopping orbitdb')
      await this.storageService.stopOrbitDb()
    }
    this.libp2pService.libp2pInstance = null
    this.libp2pService.connectedPeers = new Map()
    this.communityState = ServiceState.DEFAULT
    this.registrarState = ServiceState.DEFAULT
    console.log('after closing services')
  }
  public async openServices(options: OpenServices) {
    this.tor.setControlPort(options.torControlPort)
    console.log('becore opening services')
    this.ports = { ...this.ports, libp2pHiddenService: await getPort() }
    await this.localDbService.open()
    await this.socketService.listen(options.socketIOPort)
    console.log('before launching community from storage')
    await this.launchCommunityFromStorage()
  }

  public async closeAllServices(options: { saveTor: boolean } = { saveTor: false }) {
    if (this.tor && !this.configOptions.torControlPort && !options.saveTor) {
      await this.tor.kill()
    }
    if (this.registrationService) {
      this.logger.log('Stopping registration service')
      await this.registrationService.stop()
    }
    if (this.storageService) {
      this.logger.log('Stopping orbitdb')
      await this.storageService.stopOrbitDb()
    }
    // if (this.storageService.ipfs) {
    //   this.storageService.ipfs = null
    // }
    if (this.serverIoProvider.io) {
      this.logger.log('Closing socket server')
      this.serverIoProvider.io.close()
    }
    if (this.localDbService) {
      this.logger.log('Closing local storage')
      await this.localDbService.close()
    }
    if (this.libp2pService.libp2pInstance) {
      this.logger.log('Stopping libp2p')
      await this.libp2pService.libp2pInstance.stop()
    }
  }

  public async leaveCommunity() {
    this.serverIoProvider.io.close()
    await this.localDbService.purge()
    await this.closeAllServices({ saveTor: true })
    await this.purgeData()
    this.communityId = ''
    this.ports = { ...this.ports, libp2pHiddenService: await getPort() }
    this.libp2pService.libp2pInstance = null
    this.libp2pService.connectedPeers = new Map()
    this.communityState = ServiceState.DEFAULT
    this.registrarState = ServiceState.DEFAULT
    await this.localDbService.open()
    await this.socketService.init()
  }

  public async purgeData() {
    console.log('removing data')
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

  public getNetwork = async () => {
    const hiddenService = await this.tor.createNewHiddenService({ targetPort: this.ports.libp2pHiddenService })

    await this.tor.destroyHiddenService(hiddenService.onionAddress.split('.')[0])
    const peerId: PeerId = await PeerId.create()
    const peerIdJson = peerId.toJSON()
    this.logger.log(`Created network for peer ${peerId.toString()}. Address: ${hiddenService.onionAddress}`)

    return {
      hiddenService,
      peerId: peerIdJson,
    }
  }

  public async createNetwork(community: Community) {
    let network: NetworkData
    // For registrar service purposes, if community owner
    let network2: NetworkData
    try {
      network = await this.getNetwork()
      network2 = await this.getNetwork()
    } catch (e) {
      this.logger.log.error(`Creating network for community ${community.id} failed`, e)
      emitError(this.serverIoProvider.io, {
        type: SocketActionTypes.NETWORK,
        message: ErrorMessages.NETWORK_SETUP_FAILED,
        community: community.id,
      })
      return
    }

    this.logger.log(`Sending network data for ${community.id}`)

    const payload: ResponseCreateNetworkPayload = {
      community: {
        ...community,
        privateKey: network2.hiddenService.privateKey,
        registrarUrl: community.registrarUrl || network2.hiddenService.onionAddress.split('.')[0],
      },
      network,
    }
    this.serverIoProvider.io.emit(SocketActionTypes.NETWORK, payload)
  }

  public async createCommunity(payload: InitCommunityPayload) {
    await this.launchCommunity(payload)
    this.logger.log(`Created and launched community ${payload.id}`)
    this.serverIoProvider.io.emit(SocketActionTypes.NEW_COMMUNITY, { id: payload.id })
  }

  public async launchCommunity(payload: InitCommunityPayload) {
    this.communityState = ServiceState.LAUNCHING
    const communityData: InitCommunityPayload = await this.localDbService.get(LocalDBKeys.COMMUNITY)
    if (!communityData) {
      await this.localDbService.put(LocalDBKeys.COMMUNITY, payload)
    }

    try {
      await this.launch(payload)
    } catch (e) {
      this.logger.log(`Couldn't launch community for peer ${payload.peerId.id}.`, e)
      emitError(this.serverIoProvider.io, {
        type: SocketActionTypes.COMMUNITY,
        message: ErrorMessages.COMMUNITY_LAUNCH_FAILED,
        community: payload.id,
      })
      return
    }

    this.logger.log(`Launched community ${payload.id}`)
    this.serverIoProvider.io.emit(SocketActionTypes.CONNECTION_PROCESS_INFO, ConnectionProcessInfo.LAUNCHED_COMMUNITY)
    this.communityId = payload.id
    this.communityState = ServiceState.LAUNCHED
    this.serverIoProvider.io.emit(SocketActionTypes.COMMUNITY, { id: payload.id })
  }

  public launch = async (payload: InitCommunityPayload) => {
    // Start existing community (community that user is already a part of)
    this.logger.log(`Spawning hidden service for community ${payload.id}, peer: ${payload.peerId.id}`)
    this.serverIoProvider.io.emit(
      SocketActionTypes.CONNECTION_PROCESS_INFO,
      ConnectionProcessInfo.SPAWNING_HIDDEN_SERVICE
    )
    const onionAddress: string = await this.tor.spawnHiddenService({
      targetPort: this.ports.libp2pHiddenService,
      privKey: payload.hiddenService.privateKey,
    })
    this.logger.log(`Launching community ${payload.id}, peer: ${payload.peerId.id}`)

    const { Libp2pModule } = await import('../libp2p/libp2p.module')
    const moduleRef = await this.lazyModuleLoader.load(() => Libp2pModule)
    this.logger.log('launchCommunityFromStorage')
    const { Libp2pService } = await import('../libp2p/libp2p.service')
    const lazyService = moduleRef.get(Libp2pService)
    this.libp2pService = lazyService

    const restoredRsa = await PeerId.createFromJSON(payload.peerId)
    const _peerId = await peerIdFromKeys(restoredRsa.marshalPubKey(), restoredRsa.marshalPrivKey())

    let peers = payload.peers
    if (!peers || peers.length === 0) {
      peers = [this.libp2pService.createLibp2pAddress(onionAddress, _peerId.toString())]
    }

    const params: Libp2pNodeParams = {
      peerId: _peerId,
      listenAddresses: [this.libp2pService.createLibp2pListenAddress(onionAddress)],
      agent: this.socksProxyAgent,
      cert: payload.certs.certificate,
      key: payload.certs.key,
      ca: payload.certs.CA,
      localAddress: this.libp2pService.createLibp2pAddress(onionAddress, _peerId.toString()),
      targetPort: this.ports.libp2pHiddenService,
      peers,
    }
    this.logger.log('libp2p params', params)

    await this.libp2pService.createInstance(params)
    await this.storageService.init(_peerId)
  }

  private attachTorEventsListeners = () => {
    this.logger.log('attachTorEventsListeners')

    this.socketService.on(SocketActionTypes.CONNECTION_PROCESS_INFO, data => {
      this.serverIoProvider.io.emit(SocketActionTypes.CONNECTION_PROCESS_INFO, data)
    })

    this.registrationService.on(SocketActionTypes.CONNECTION_PROCESS_INFO, data => {
      this.serverIoProvider.io.emit(SocketActionTypes.CONNECTION_PROCESS_INFO, data)
    })
  }

  private attachRegistrationListeners = () => {
    this.registrationService.on(RegistrationEvents.REGISTRAR_STATE, (payload: ServiceState) => {
      this.registrarState = payload
    })
    this.registrationService.on(SocketActionTypes.SAVED_OWNER_CERTIFICATE, payload => {
      this.serverIoProvider.io.emit(SocketActionTypes.SAVED_OWNER_CERTIFICATE, payload)
    })
    this.registrationService.on(RegistrationEvents.SPAWN_HS_FOR_REGISTRAR, async payload => {
      await this.tor.spawnHiddenService({
        targetPort: payload.port,
        privKey: payload.privateKey,
        virtPort: payload.targetPort,
      })
    })
    this.registrationService.on(RegistrationEvents.ERROR, payload => {
      emitError(this.serverIoProvider.io, payload)
    })
    this.registrationService.on(SocketActionTypes.SEND_USER_CERTIFICATE, payload => {
      this.serverIoProvider.io.emit(SocketActionTypes.SEND_USER_CERTIFICATE, payload)
    })
    this.registrationService.on(RegistrationEvents.NEW_USER, async payload => {
      await this.storageService?.saveCertificate(payload)
    })
  }

  private attachsocketServiceListeners = () => {
    // Community
    this.socketService.on(SocketActionTypes.LEAVE_COMMUNITY, async () => {
      await this.leaveCommunity()
    })
    this.socketService.on(SocketActionTypes.CONNECTION, async () => {
      // Update Frontend with Initialized Communities
      if (this.communityId) {
        this.serverIoProvider.io.emit(SocketActionTypes.COMMUNITY, { id: this.communityId })
        console.log('this.libp2pService.connectedPeers', this.libp2pService.connectedPeers)
        console.log('this.libp2pservice', this.libp2pService)
        this.serverIoProvider.io.emit(
          SocketActionTypes.CONNECTED_PEERS,
          Array.from(this.libp2pService.connectedPeers.keys())
        )
        await this.storageService?.loadAllCertificates()
        await this.storageService?.loadAllChannels()
      }
    })
    this.socketService.on(SocketActionTypes.CREATE_NETWORK, async (args: Community) => {
      await this.createNetwork(args)
    })
    this.socketService.on(SocketActionTypes.CREATE_COMMUNITY, async (args: InitCommunityPayload) => {
      await this.createCommunity(args)
    })
    this.socketService.on(SocketActionTypes.LAUNCH_COMMUNITY, async (args: InitCommunityPayload) => {
      this.logger.log(`socketService - ${SocketActionTypes.LAUNCH_COMMUNITY}`)
      if ([ServiceState.LAUNCHING, ServiceState.LAUNCHED].includes(this.communityState)) return
      this.communityState = ServiceState.LAUNCHING
      await this.launchCommunity(args)
    })
    // Registration
    this.socketService.on(SocketActionTypes.LAUNCH_REGISTRAR, async (args: LaunchRegistrarPayload) => {
      this.logger.log(`socketService - ${SocketActionTypes.LAUNCH_REGISTRAR}`)

      const communityData = await this.localDbService.get(LocalDBKeys.REGISTRAR)
      if (!communityData) {
        await this.localDbService.put(LocalDBKeys.REGISTRAR, args)
      }
      if ([ServiceState.LAUNCHING, ServiceState.LAUNCHED].includes(this.registrarState)) return
      this.registrarState = ServiceState.LAUNCHING
      await this.registrationService.launchRegistrar(args)
    })
    this.socketService.on(SocketActionTypes.SAVED_OWNER_CERTIFICATE, async (args: SaveOwnerCertificatePayload) => {
      const saveCertificatePayload: SaveCertificatePayload = {
        certificate: args.certificate,
        rootPermsData: args.permsData,
      }
      await this.storageService?.saveCertificate(saveCertificatePayload)
    })
    this.socketService.on(SocketActionTypes.REGISTER_USER_CERTIFICATE, async (args: RegisterUserCertificatePayload) => {
      // if (!this.socksProxyAgent) {
      //   this.createAgent()
      // }

      await this.registrationService.sendCertificateRegistrationRequest(
        args.serviceAddress,
        args.userCsr,
        args.communityId,
        120_000,
        this.socksProxyAgent
      )
    })
    this.socketService.on(
      SocketActionTypes.REGISTER_OWNER_CERTIFICATE,
      async (args: RegisterOwnerCertificatePayload) => {
        await this.registrationService.registerOwnerCertificate(args)
      }
    )

    // Public Channels
    this.socketService.on(SocketActionTypes.CREATE_CHANNEL, async (args: CreateChannelPayload) => {
      await this.storageService?.subscribeToChannel(args.channel)
    })
    this.socketService.on(SocketActionTypes.SEND_MESSAGE, async (args: SendMessagePayload) => {
      await this.storageService?.sendMessage(args.message)
    })
    this.socketService.on(SocketActionTypes.ASK_FOR_MESSAGES, async (args: AskForMessagesPayload) => {
      await this.storageService?.askForMessages(args.channelId, args.ids)
    })

    // Files
    this.socketService.on(SocketActionTypes.DOWNLOAD_FILE, async (metadata: FileMetadata) => {
      await this.storageService?.downloadFile(metadata)
    })
    this.socketService.on(SocketActionTypes.UPLOAD_FILE, async (metadata: FileMetadata) => {
      await this.storageService?.uploadFile(metadata)
    })
    this.socketService.on(SocketActionTypes.UPLOADED_FILE, async (args: FileMetadata) => {
      await this.storageService?.uploadFile(args)
    })
    this.socketService.on(SocketActionTypes.CANCEL_DOWNLOAD, mid => {
      this.storageService?.cancelDownload(mid)
    })

    // Direct Messages
    this.socketService.on(SocketActionTypes.INITIALIZE_CONVERSATION, async (address, encryptedPhrase) => {
      await this.storageService?.initializeConversation(address, encryptedPhrase)
    })
    this.socketService.on(SocketActionTypes.GET_PRIVATE_CONVERSATIONS, async () => {
      await this.storageService?.getPrivateConversations()
    })
    this.socketService.on(SocketActionTypes.SEND_DIRECT_MESSAGE, async (channelId: string, messagePayload) => {
      await this.storageService?.sendDirectMessage(channelId, messagePayload)
    })
    this.socketService.on(SocketActionTypes.SUBSCRIBE_FOR_DIRECT_MESSAGE_THREAD, async (address: string) => {
      await this.storageService?.subscribeToDirectMessageThread(address)
    })
    this.socketService.on(SocketActionTypes.SUBSCRIBE_FOR_ALL_CONVERSATIONS, async (conversations: string[]) => {
      await this.storageService?.subscribeToAllConversations(conversations)
    })

    this.socketService.on(SocketActionTypes.CLOSE, async () => {
      await this.closeAllServices()
    })
    this.socketService.on(
      SocketActionTypes.DELETE_CHANNEL,
      async (payload: { channelId: string; ownerPeerId: string }) => {
        await this.storageService?.deleteChannel(payload)
      }
    )

    this.socketService.on(
      SocketActionTypes.DELETE_FILES_FROM_CHANNEL,
      async (payload: DeleteFilesFromChannelSocketPayload) => {
        this.logger.log('DELETE_FILES_FROM_CHANNEL : payload', payload)
        await this.storageService?.deleteFilesFromChannel(payload)
        // await this.deleteFilesFromTemporaryDir() //crashes on mobile, will be fixes in next versions
      }
    )
  }

  private attachStorageListeners = () => {
    if (!this.storageService) return
    this.storageService.on(SocketActionTypes.CONNECTION_PROCESS_INFO, data => {
      this.serverIoProvider.io.emit(SocketActionTypes.CONNECTION_PROCESS_INFO, data)
    })
    this.storageService.on(StorageEvents.LOAD_CERTIFICATES, (payload: SendCertificatesResponse) => {
      this.serverIoProvider.io.emit(SocketActionTypes.RESPONSE_GET_CERTIFICATES, payload)
      this.registrationService.emit(RegistrationEvents.SET_CERTIFICATES, payload.certificates)
    })
    this.storageService.on(StorageEvents.LOAD_PUBLIC_CHANNELS, (payload: ChannelsReplicatedPayload) => {
      this.serverIoProvider.io.emit(SocketActionTypes.CHANNELS_REPLICATED, payload)
    })
    this.storageService.on(StorageEvents.LOAD_ALL_PRIVATE_CONVERSATIONS, payload => {
      this.serverIoProvider.io.emit(SocketActionTypes.RESPONSE_GET_PRIVATE_CONVERSATIONS, payload)
    })
    this.storageService.on(StorageEvents.LOAD_MESSAGES, (payload: IncomingMessages) => {
      this.serverIoProvider.io.emit(SocketActionTypes.INCOMING_MESSAGES, payload)
    })
    this.storageService.on(StorageEvents.SEND_MESSAGES_IDS, (payload: ChannelMessagesIdsResponse) => {
      if (payload.ids.length === 0) {
        return
      }
      this.serverIoProvider.io.emit(SocketActionTypes.SEND_MESSAGES_IDS, payload)
    })
    this.storageService.on(StorageEvents.SET_CHANNEL_SUBSCRIBED, (payload: SetChannelSubscribedPayload) => {
      this.serverIoProvider.io.emit(SocketActionTypes.CHANNEL_SUBSCRIBED, payload)
    })
    this.storageService.on(StorageEvents.CREATED_CHANNEL, (payload: CreatedChannelResponse) => {
      console.log('created channel in services')
      this.serverIoProvider.io.emit(SocketActionTypes.CREATED_CHANNEL, payload)
    })
    this.storageService.on(StorageEvents.REMOVE_DOWNLOAD_STATUS, (payload: RemoveDownloadStatus) => {
      this.serverIoProvider.io.emit(SocketActionTypes.REMOVE_DOWNLOAD_STATUS, payload)
    })
    this.storageService.on(StorageEvents.UPLOADED_FILE, (payload: UploadFilePayload) => {
      this.serverIoProvider.io.emit(SocketActionTypes.UPLOADED_FILE, payload)
    })
    this.storageService.on(StorageEvents.UPDATE_DOWNLOAD_PROGRESS, (payload: DownloadStatus) => {
      this.serverIoProvider.io.emit(SocketActionTypes.DOWNLOAD_PROGRESS, payload)
    })
    this.storageService.on(StorageEvents.UPDATE_MESSAGE_MEDIA, (payload: FileMetadata) => {
      this.serverIoProvider.io.emit(SocketActionTypes.UPDATE_MESSAGE_MEDIA, payload)
    })
    this.storageService.on(StorageEvents.LOAD_ALL_DIRECT_MESSAGES, payload => {
      if (payload.messages.length === 0) {
        return
      }
      this.serverIoProvider.io.emit(SocketActionTypes.RESPONSE_FETCH_ALL_DIRECT_MESSAGES, payload)
    })
    this.storageService.on(StorageEvents.UPDATE_PEERS_LIST, (payload: StorePeerListPayload) => {
      this.serverIoProvider.io.emit(SocketActionTypes.PEER_LIST, payload)
    })
    this.storageService.on(StorageEvents.SEND_PUSH_NOTIFICATION, (payload: PushNotificationPayload) => {
      this.serverIoProvider.io.emit(SocketActionTypes.PUSH_NOTIFICATION, payload)
    })
    this.storageService.on(StorageEvents.CHECK_FOR_MISSING_FILES, (payload: CommunityId) => {
      this.serverIoProvider.io.emit(SocketActionTypes.CHECK_FOR_MISSING_FILES, payload)
    })
    this.storageService.on(StorageEvents.CHANNEL_DELETION_RESPONSE, (payload: { channelId: string }) => {
      console.log('emitting deleted channel event back to state manager')
      this.serverIoProvider.io.emit(SocketActionTypes.CHANNEL_DELETION_RESPONSE, payload)
    })
  }
}
