import { Inject, Injectable, Logger, OnModuleInit, OnApplicationBootstrap } from '@nestjs/common'
import { Crypto } from '@peculiar/webcrypto'
import { Agent } from 'https'
import fs from 'fs'
import path from 'path'
import { peerIdFromKeys } from '@libp2p/peer-id'
import { setEngine, CryptoEngine } from 'pkijs'
import { EventEmitter } from 'events'
import getPort from 'get-port'
import PeerId from 'peer-id'
import { getPorts, removeFilesFromDir } from '../common/utils'
import { AskForMessagesPayload, ChannelMessagesIdsResponse, ChannelsReplicatedPayload, Community, CommunityId, ConnectionProcessInfo, CreateChannelPayload, CreatedChannelResponse, DeleteFilesFromChannelSocketPayload, DownloadStatus, ErrorMessages, FileMetadata, IncomingMessages, InitCommunityPayload, LaunchRegistrarPayload, NetworkData, NetworkDataPayload, NetworkStats, PushNotificationPayload, RegisterOwnerCertificatePayload, RegisterUserCertificatePayload, RemoveDownloadStatus, ResponseCreateNetworkPayload, SaveCertificatePayload, SaveOwnerCertificatePayload, SendCertificatesResponse, SendMessagePayload, SetChannelSubscribedPayload, SocketActionTypes, StorePeerListPayload, UploadFilePayload, PeerId as PeerIdType } from '@quiet/types'
import { CONFIG_OPTIONS, PEER_ID_PROVIDER, QUIET_DIR, SERVER_IO_PROVIDER, SOCKS_PROXY_AGENT } from '../const'
import { ConfigOptions, ServerIoProviderTypes } from '../types'
import { SocketService } from '../socket/socket.service'
import { RegistrationService } from '../registration/registration.service'
import { LocalDbService } from '../local-db/local-db.service'
import { StorageService } from '../storage/storage.service'
import { ServiceState, TorInitState } from './connections-manager.types'
import { Libp2pService } from '../libp2p/libp2p.service'
import { Tor } from '../tor/tor.service'
import { LocalDBKeys } from '../local-db/local-db.types'
import { InitLibp2pParams, Libp2pEvents } from '../libp2p/libp2p.types'
import { TorControl } from '../tor/tor-control.service'
import { emitError } from '../../socket/errors'
import { RegistrationEvents } from '../registration/registration.types'
import { InitStorageParams, StorageEvents } from '../storage/storage.types'
import { onionAddress } from '../../singletons'

@Injectable()
export class ConnectionsManagerService extends EventEmitter implements OnModuleInit, OnApplicationBootstrap {
    // registration: CertificateRegistration
    // httpTunnelPort?: number
    // socksProxyAgent: Agent
    // options: ConnectionsManagerOptions
    // quietDir: string
    // io: SocketIO.Server
    // tor: Tor
    // libp2pInstance: Libp2p | null
    // connectedPeers: Map<string, number>
    // socketIOPort: number
    // storage: Storage | null
    // socketService: socketService
    // torAuthCookie?: string
    // torControlPort?: number
    // torBinaryPath?: string
    // torResourcesPath?: string
    // localStorage: LocalDB
    public communityId: string
    public communityState: ServiceState
    public registrarState: ServiceState
    isTorInit: TorInitState = TorInitState.NOT_STARTED

    private readonly logger = new Logger(ConnectionsManagerService.name)
    constructor(

    @Inject(SERVER_IO_PROVIDER) public readonly serverIoProvider: ServerIoProviderTypes,
    @Inject(CONFIG_OPTIONS) public configOptions: ConfigOptions,
    @Inject(QUIET_DIR) public readonly quietDir: string,
    @Inject(SOCKS_PROXY_AGENT) public readonly socksProxyAgent: Agent,
    @Inject(PEER_ID_PROVIDER) public readonly peerId: PeerId,
    private readonly socketService: SocketService,
    private readonly registrationService: RegistrationService,
    private readonly localDbService: LocalDbService,
    private readonly storageService: StorageService,
    private readonly libp2pService: Libp2pService,
    private readonly tor: Tor,
    ) {
      super()
    //   this.registration = new CertificateRegistration()
    //   this.options = {
    //     ...new ConnectionsManagerOptions(),
    //     ...options
    //   }

    //   this.torResourcesPath = torResourcesPath
    //   this.torBinaryPath = torBinaryPath
    //   this.torControlPort = torControlPort
    //   this.torAuthCookie = torAuthCookie

    //   this.socketIOPort = socketIOPort
    //   this.httpTunnelPort = httpTunnelPort
    //   this.quietDir = this.options.env?.appDataPath || QUIET_DIR_PATH
    //   this.connectedPeers = new Map()

    //   // Does it work?
    //   process.on('unhandledRejection', error => {
    //     console.error(error)
    //     throw new Error()
    //   })
    //   process.on('SIGINT', function () {
    //     // This is not graceful even in a single percent. we must close services first, not just kill process %
    //     log('\nGracefully shutting down from SIGINT (Ctrl-C)')
    //     process.exit(0)
    //   })
    //   const webcrypto = new Crypto()
    //   // @ts-ignore
    //   global.crypto = webcrypto

    //   setEngine('newEngine', new CryptoEngine({
    //     name: 'newEngine',
    //     // @ts-ignore
    //     crypto: webcrypto,
    //   }))
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

      setEngine('newEngine', new CryptoEngine({
        name: 'newEngine',
        // @ts-ignore
        crypto: webcrypto,
      }))
      console.log('init')
      this.communityState = ServiceState.DEFAULT
      this.registrarState = ServiceState.DEFAULT

    //   this.localStorage = new LocalDB(this.quietDir)
    // console.log('servcies !!!!!!!', this.socketService,
    // this.registrationService,
    // this.localDbService,
    // this.storageService,
    // this.libp2pService,)
      if (!this.configOptions.httpTunnelPort) {
        this.configOptions.httpTunnelPort = await getPort()
      }

    //   this.createAgent()

      // if (!this.tor) {
      //   await this.spawnTor()
      // }

      this.attachsocketServiceListeners()
      this.attachRegistrationListeners()
      this.attachTorEventsListeners()

      // Libp2p event listeners
      this.on(Libp2pEvents.PEER_CONNECTED, (payload: { peers: string[] }) => {
        this.serverIoProvider.io.emit(SocketActionTypes.PEER_CONNECTED, payload)
      })
      this.on(Libp2pEvents.PEER_DISCONNECTED, (payload: NetworkDataPayload) => {
        this.serverIoProvider.io.emit(SocketActionTypes.PEER_DISCONNECTED, payload)
      })

      await this.socketService.listen()

      if (this.configOptions.torControlPort) {
        await this.launchCommunityFromStorage()
      }

      this.serverIoProvider.io.on('connection', async() => {
        if (this.isTorInit === TorInitState.STARTED || this.isTorInit === TorInitState.STARTING) return
        this.isTorInit = TorInitState.STARTING
          if (this.configOptions.torBinaryPath) {
            // await this.tor.init()
            this.isTorInit = TorInitState.STARTED
          }
          await this.launchCommunityFromStorage()
      })
      }

      async onApplicationBootstrap() {

      }

    // public readonly createAgent = (): void => {
    //   if (this.socksProxyAgent) return

    //   this.logger.log(`Creating https proxy agent on port ${this.configOptions.httpTunnelPort}`)

    //   this.socksProxyAgent = createHttpsProxyAgent({
    //     port: this.configOptions.httpTunnelPort, host: '127.0.0.1',
    //   })
    // }

    // public init = async () => {
    //   this.communityState = ServiceState.DEFAULT
    //   this.registrarState = ServiceState.DEFAULT

    // //   this.localStorage = new LocalDB(this.quietDir)

    //   if (!this.configOptions.httpTunnelPort) {
    //     this.configOptions.httpTunnelPort = await getPort()
    //   }

    // //   this.createAgent()

    //   if (!this.tor) {
    //     await this.spawnTor()
    //   }

    // //   if (!this.socketService) {
    // //     this.socketService = new socketService(this.options.socketIOPort)
    // //     this.serverIoProvider.io = this.socketService.io
    //     this.attachsocketServiceListeners()
    //     this.attachRegistrationListeners()
    // //   }

    //   this.attachTorEventsListeners()

    //   // Libp2p event listeners
    //   this.on(Libp2pEvents.PEER_CONNECTED, (payload: { peers: string[] }) => {
    //     this.serverIoProvider.io.emit(SocketActionTypes.PEER_CONNECTED, payload)
    //   })
    //   this.on(Libp2pEvents.PEER_DISCONNECTED, (payload: NetworkDataPayload) => {
    //     this.serverIoProvider.io.emit(SocketActionTypes.PEER_DISCONNECTED, payload)
    //   })

    // //   await this.socketService.listen()

    //   await this.socketService.listen()

    //   if (this.torControlPort) {
    //     await this.launchCommunityFromStorage()
    //   }

    //   this.serverIoProvider.io.on('connection', async() => {
    //     if (this.isTorInit === TorInitState.STARTED || this.isTorInit === TorInitState.STARTING) return
    //     this.isTorInit = TorInitState.STARTING
    //       if (this.torBinaryPath) {
    //         await this.tor.init()
    //         this.isTorInit = TorInitState.STARTED
    //       }
    //       await this.launchCommunityFromStorage()
    //   })
    // }

    public async launchCommunityFromStorage () {
        this.logger.log('launchCommunityFromStorage')
      const community: InitCommunityPayload = await this.localDbService.get(LocalDBKeys.COMMUNITY)
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

    public async closeAllServices(options: {saveTor: boolean} = { saveTor: false }) {
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
      await this.closeAllServices({ saveTor: true })
      await this.purgeData()
      this.communityId = ''
      // this.storageService = null
      this.libp2pService.libp2pInstance = null
      // await this.init()
      }

      public async purgeData() {
        console.log('removing data')
        const dirsToRemove = fs.readdirSync(this.quietDir).filter(i => i.startsWith('Ipfs') || i.startsWith('OrbitDB') || i.startsWith('backendDB') || i.startsWith('Local Storage'))
        for (const dir of dirsToRemove) {
          removeFilesFromDir(path.join(this.quietDir, dir))
        }
    }

// KACPER
    public spawnTor = async () => {
      if (!this.configOptions.httpTunnelPort) throw new Error('Couldn\'t spawn tor, no httpTunnelPort!')

      // this.tor = new Tor({
      //   torPath: this.configOptions.torBinaryPath,
      //   appDataPath: this.quietDir,
      //   httpTunnelPort: this.configOptions.httpTunnelPort,
      //   authCookie: this.configOptions.torAuthCookie,
      //   controlPort: this.configOptions.torControlPort,
      //   options: {
      //     env: {
      //       LD_LIBRARY_PATH: this.configOptions.torResourcesPath,
      //       HOME: os.homedir()
      //     },
      //     detached: true
      //   }
      // })

      // if (this.configOptions.torControlPort) {
      //   this.tor.initTorControl()
      // } else if (this.configOptions.torBinaryPath) {
      //   // Tor init will be executed on connection event
      // } else {
      //   throw new Error('You must provide either tor control port or tor binary path')
      // }
    }

    // public createStorage = (peerId: string, communityId: string) => {
    //     this.logger.log(`Creating storage for community: ${communityId}`)
    //   return new Storage(this.quietDir, communityId, {
    //     ...this.configOptions,
    //     orbitDbDir: `OrbitDB${peerId}`,
    //     ipfsDir: `Ipfs${peerId}`
    //   })
    // }

    public getNetwork = async () => {
      const ports = await getPorts()
      const hiddenService = await this.tor.createNewHiddenService({ targetPort: ports.libp2pHiddenService })

      await this.tor.destroyHiddenService(hiddenService.onionAddress.split('.')[0])

      this.logger.log(`Created network for peer ${this.peerId.toString()}. Address: ${hiddenService.onionAddress}`)
console.log('this.peerId', this.peerId)

const _peerId = this.peerId as unknown as PeerIdType
      return {
        hiddenService,
        peerId: _peerId
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
        this.logger.error(`Creating network for community ${community.id} failed`, e)
        emitError(this.serverIoProvider.io, {
          type: SocketActionTypes.NETWORK,
          message: ErrorMessages.NETWORK_SETUP_FAILED,
          community: community.id
        })
        return
      }

      this.logger.log(`Sending network data for ${community.id}`)

      const payload: ResponseCreateNetworkPayload = {
        community: {
          ...community,
          privateKey: network2.hiddenService.privateKey,
          registrarUrl: community.registrarUrl || network2.hiddenService.onionAddress.split('.')[0]
        },
        network
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
          community: payload.id
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
      const ports = await getPorts()
      this.logger.log(`Spawning hidden service for community ${payload.id}, peer: ${payload.peerId.id}`)
      this.serverIoProvider.io.emit(SocketActionTypes.CONNECTION_PROCESS_INFO, ConnectionProcessInfo.SPAWNING_HIDDEN_SERVICE)
      const _onionAddress: string = await this.tor.spawnHiddenService({
        targetPort: ports.libp2pHiddenService,
        privKey: payload.hiddenService.privateKey
      })
      onionAddress.set(_onionAddress)
      this.logger.log(`Launching community ${payload.id}, peer: ${payload.peerId.id}`)

      const restoredRsa = await PeerId.createFromJSON(payload.peerId)
      const peerId = await peerIdFromKeys(restoredRsa.marshalPubKey(), restoredRsa.marshalPrivKey())

      // const initStorageParams: InitStorageParams = {
      //   communityId: payload.id,
      //   peerId: peerId,
      //   onionAddress: onionAddress,
      //   targetPort: ports.libp2pHiddenService,
      //   peers: payload.peers,
      //   certs: payload.certs
      // }
      // return await this.initStorage(initStorageParams)
    }

    public initStorage = async (params: InitStorageParams) => {
      const peerIdB58string = params.peerId.toString()
      this.logger.log(`Initializing storage for peer ${peerIdB58string}...`)
      this.serverIoProvider.io.emit(SocketActionTypes.CONNECTION_PROCESS_INFO, ConnectionProcessInfo.INITIALIZING_STORAGE)

      let peers = params.peers
      if (!peers || peers.length === 0) {
      // PROVIDER
        peers = [this.libp2pService.createLibp2pAddress(params.onionAddress, peerIdB58string)]
      }

      // const libp2pParams: InitLibp2pParams = {
      //   peerId: params.peerId,
      //   address: params.onionAddress,
      //   addressPort: 443,
      //   targetPort: params.targetPort,
      //   bootstrapMultiaddrs: peers,
      //   certs: params.certs
      // }
// KACPER
      // const libp2pObj = await this.initLibp2p(libp2pParams)

      // this.storageService = this.createStorage(peerIdB58string, params.communityId)

      this.attachStorageListeners()

      // await this.storageService.init(libp2pObj.libp2p, params.peerId)

      await this.storageService.initDatabases()

      this.logger.log(`Initialized storage for peer ${peerIdB58string}`)

      // return libp2pObj.localAddress
    }

    private attachTorEventsListeners = () => {
      this.logger.log('attachTorEventsListeners')
      this.tor.on(SocketActionTypes.TOR_BOOTSTRAP_PROCESS, (data) => {
        this.logger.log('TOR_BOOTSTRAP_PROCESS', data)
        this.serverIoProvider.io.emit(SocketActionTypes.TOR_BOOTSTRAP_PROCESS, data)
      })

      this.socketService.on(SocketActionTypes.CONNECTION_PROCESS_INFO, (data) => {
        this.serverIoProvider.io.emit(SocketActionTypes.CONNECTION_PROCESS_INFO, data)
      })

      this.registrationService.on(SocketActionTypes.CONNECTION_PROCESS_INFO, (data) => {
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
      this.registrationService.on(RegistrationEvents.SPAWN_HS_FOR_REGISTRAR, async (payload) => {
        await this.tor.spawnHiddenService({
          targetPort: payload.port,
          privKey: payload.privateKey,
          virtPort: payload.targetPort
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
          this.serverIoProvider.io.emit(SocketActionTypes.CONNECTED_PEERS, Array.from(this.libp2pService.connectedPeers.keys()))
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
      this.socketService.on(
        SocketActionTypes.SAVED_OWNER_CERTIFICATE,
        async (args: SaveOwnerCertificatePayload) => {
          const saveCertificatePayload: SaveCertificatePayload = {
            certificate: args.certificate,
            rootPermsData: args.permsData
          }
          await this.storageService?.saveCertificate(saveCertificatePayload)
        }
      )
      this.socketService.on(
        SocketActionTypes.REGISTER_USER_CERTIFICATE,
        async (args: RegisterUserCertificatePayload) => {
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
        }
      )
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
      this.socketService.on(
        SocketActionTypes.INITIALIZE_CONVERSATION,
        async (address, encryptedPhrase) => {
          await this.storageService?.initializeConversation(address, encryptedPhrase)
        }
      )
      this.socketService.on(SocketActionTypes.GET_PRIVATE_CONVERSATIONS, async () => {
        await this.storageService?.getPrivateConversations()
      })
      this.socketService.on(
        SocketActionTypes.SEND_DIRECT_MESSAGE,
        async (channelId: string, messagePayload) => {
          await this.storageService?.sendDirectMessage(channelId, messagePayload)
        }
      )
      this.socketService.on(
        SocketActionTypes.SUBSCRIBE_FOR_DIRECT_MESSAGE_THREAD,
        async (address: string) => {
          await this.storageService?.subscribeToDirectMessageThread(address)
        }
      )
      this.socketService.on(
        SocketActionTypes.SUBSCRIBE_FOR_ALL_CONVERSATIONS,
        async (conversations: string[]) => {
          await this.storageService?.subscribeToAllConversations(conversations)
        }
      )

      this.socketService.on(SocketActionTypes.CLOSE, async () => {
        await this.closeAllServices()
      })
      this.socketService.on(SocketActionTypes.DELETE_CHANNEL, async (payload: {channelId: string; ownerPeerId: string}) => {
        await this.storageService?.deleteChannel(payload)
      })

      this.socketService.on(SocketActionTypes.DELETE_FILES_FROM_CHANNEL, async (payload: DeleteFilesFromChannelSocketPayload) => {
        this.logger.log('DELETE_FILES_FROM_CHANNEL : payload', payload)
        await this.storageService?.deleteFilesFromChannel(payload)
        // await this.deleteFilesFromTemporaryDir() //crashes on mobile, will be fixes in next versions
      })
    }

    private attachStorageListeners = () => {
      if (!this.storageService) return
      this.storageService.on(SocketActionTypes.CONNECTION_PROCESS_INFO, (data) => {
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
      this.storageService.on(
        StorageEvents.SET_CHANNEL_SUBSCRIBED,
        (payload: SetChannelSubscribedPayload) => {
          this.serverIoProvider.io.emit(SocketActionTypes.CHANNEL_SUBSCRIBED, payload)
        }
      )
      this.storageService.on(StorageEvents.CREATED_CHANNEL, (payload: CreatedChannelResponse) => {
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
      this.storageService.on(StorageEvents.CHANNEL_DELETION_RESPONSE, (payload: {channelId: string}) => {
        console.log('emitting deleted channel event back to state manager')
        this.serverIoProvider.io.emit(SocketActionTypes.CHANNEL_DELETION_RESPONSE, payload)
      })
    }

    // REFACTORING: Move all the below methods to libp2p module
    // public initLibp2p = async (
    //   params: InitLibp2pParams
    // ): Promise<{ libp2p: Libp2p; localAddress: string }> => {
    //   const localAddress = this.createLibp2pAddress(params.address, params.peerId.toString())

    //   this.logger.log(
    //     `Initializing libp2p for ${params.peerId.toString()}, bootstrapping with ${params.bootstrapMultiaddrs.length} peers`
    //   )
    //   this.serverIoProvider.io.emit(SocketActionTypes.CONNECTION_PROCESS_INFO, ConnectionProcessInfo.INITIALIZING_LIBP2P)
    //   const nodeParams: Libp2pNodeParams = {
    //     peerId: params.peerId,
    //     listenAddresses: [this.createLibp2pListenAddress(params.address)],
    //     agent: this.socksProxyAgent,
    //     localAddress: localAddress,
    //     cert: params.certs.certificate,
    //     key: params.certs.key,
    //     ca: params.certs.CA,
    //     targetPort: params.targetPort
    //   }
    //   const libp2p: Libp2p = await ConnectionsManager.createBootstrapNode(nodeParams)

    //   this.libp2pInstance = libp2p
    //   const dialInChunks = new ProcessInChunks<string>(params.bootstrapMultiaddrs, this.dialPeer)

    //   libp2p.addEventListener('peer:discovery', (peer) => {
    //     this.logger.log(`${params.peerId.toString()} discovered ${peer.detail.id}`)
    //   })

    //   libp2p.addEventListener('peer:connect', async (peer) => {
    //     const remotePeerId = peer.detail.remotePeer.toString()
    //     this.logger.log(`${params.peerId.toString()} connected to ${remotePeerId}`)

    //     // Stop dialing as soon as we connect to a peer
    //     dialInChunks.stop()

    //     this.connectedPeers.set(remotePeerId, DateTime.utc().valueOf())

    //     this.emit(Libp2pEvents.PEER_CONNECTED, {
    //       peers: [remotePeerId]
    //     })
    //   })

    //   libp2p.addEventListener('peer:disconnect', async (peer) => {
    //     const remotePeerId = peer.detail.remotePeer.toString()
    //     this.logger.log(`${params.peerId.toString()} disconnected from ${remotePeerId}`)
    //     this.logger.log(`${libp2p.getConnections().length} open connections`)

    //     const connectionStartTime = this.connectedPeers.get(remotePeerId)
    //     if (!connectionStartTime) {
    //       log.error(`No connection start time for peer ${remotePeerId}`)
    //       return
    //     }

    //     const connectionEndTime: number = DateTime.utc().valueOf()

    //     const connectionDuration: number = connectionEndTime - connectionStartTime

    //     this.connectedPeers.delete(remotePeerId)

    //     // Get saved peer stats from db
    //     const remotePeerAddress = peer.detail.remoteAddr.toString()
    //     const peerPrevStats = await this.localDbService.find(LocalDBKeys.PEERS, remotePeerAddress)
    //     const prev = peerPrevStats?.connectionTime || 0

    //     const peerStats: NetworkStats = {
    //       peerId: remotePeerId,
    //       connectionTime: prev + connectionDuration,
    //       lastSeen: connectionEndTime
    //     }

    //     // Save updates stats to db
    //     await this.localDbService.update(LocalDBKeys.PEERS, {
    //       [remotePeerAddress]: peerStats
    //     })

    //     this.emit(Libp2pEvents.PEER_DISCONNECTED, {
    //       peer: remotePeerId,
    //       connectionDuration,
    //       lastSeen: connectionEndTime
    //     })
    //   })

    //   await dialInChunks.process()

    //   this.logger.log(`Initialized libp2p for peer ${params.peerId.toString()}`)

    //   return {
    //     libp2p,
    //     localAddress
    //   }
    // }
  }
