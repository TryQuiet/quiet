import { Crypto } from '@peculiar/webcrypto'
import { Agent } from 'https'
import fs from 'fs'
import path from 'path'
import createHttpsProxyAgent from 'https-proxy-agent'

import { peerIdFromKeys } from '@libp2p/peer-id'
import { createLibp2p, Libp2p } from 'libp2p'
import { noise } from '@chainsafe/libp2p-noise'
import { gossipsub } from '@chainsafe/libp2p-gossipsub'
import { mplex } from '@libp2p/mplex'
import { kadDHT } from '@libp2p/kad-dht'
import { createServer } from 'it-ws'

import { webSockets } from './websocketOverTor/index'
import { all } from './websocketOverTor/filters'

import { DateTime } from 'luxon'

import type SocketIO from 'socket.io'
import * as os from 'os'
import { emitError } from '../socket/errors'
import { CertificateRegistration } from '../registration'
import { setEngine, CryptoEngine } from 'pkijs'

import {
  InitCommunityPayload,
  LaunchRegistrarPayload,
  RegisterOwnerCertificatePayload,
  RegisterUserCertificatePayload,
  SaveCertificatePayload,
  CreateChannelPayload,
  SaveOwnerCertificatePayload,
  SocketActionTypes,
  ErrorMessages,
  Community,
  NetworkData,
  ResponseCreateNetworkPayload,
  AskForMessagesPayload,
  FileMetadata,
  Certificates,
  SendMessagePayload,
  NetworkDataPayload,
  PushNotificationPayload,
  SendCertificatesResponse,
  ChannelsReplicatedPayload,
  IncomingMessages,
  ChannelMessagesIdsResponse,
  SetChannelSubscribedPayload,
  CreatedChannelResponse,
  RemoveDownloadStatus,
  UploadFilePayload,
  DownloadStatus,
  CommunityId,
  StorePeerListPayload,
  NetworkStats,
  ConnectionProcessInfo
} from '@quiet/state-manager'

import { ConnectionsManagerOptions } from '../common/types'

import { QUIET_DIR_PATH } from '../constants'
import { Storage } from '../storage'
import { Tor } from '../torManager'
import { DataServer } from '../socket/DataServer'
import { EventEmitter } from 'events'
import logger from '../logger'
import getPort from 'get-port'
import { RegistrationEvents } from '../registration/types'
import { StorageEvents } from '../storage/types'
import { Libp2pEvents, ServiceState } from './types'
import PeerId from 'peer-id'
import { LocalDB, LocalDBKeys } from '../storage/localDB'

import { createLibp2pAddress, createLibp2pListenAddress, getPorts, removeFilesFromDir } from '../common/utils'
import { ProcessInChunks } from './processInChunks'
import { Multiaddr } from 'multiaddr'

const log = logger('conn')
interface InitStorageParams {
  communityId: string
  peerId: any
  onionAddress: string
  targetPort: number
  peers: string[]
  certs: Certificates
}

export interface IConstructor {
  options: Partial<ConnectionsManagerOptions>
  socketIOPort: number
  httpTunnelPort?: number
  torAuthCookie?: string
  torControlPort?: number
  torResourcesPath?: string
  torBinaryPath?: string
}

export interface Libp2pNodeParams {
  peerId: any
  listenAddresses: string[]
  agent: Agent
  cert: string
  key: string
  ca: string[]
  localAddress: string
  targetPort: number
}

export interface InitLibp2pParams {
  peerId: any
  address: string
  addressPort: number
  targetPort: number
  bootstrapMultiaddrs: string[]
  certs: Certificates
}

export enum TorInitState{
  STARTING = 'starting',
  STARTED = 'started',
  NOT_STARTED = 'not-started'
}

export class ConnectionsManager extends EventEmitter {
  registration: CertificateRegistration
  httpTunnelPort: number
  socksProxyAgent: Agent
  options: ConnectionsManagerOptions
  quietDir: string
  io: SocketIO.Server
  tor: Tor
  libp2pInstance: Libp2p
  connectedPeers: Map<string, number>
  socketIOPort: number
  storage: Storage
  dataServer: DataServer
  communityId: string
  torAuthCookie: string
  torControlPort: number
  torBinaryPath: string
  torResourcesPath: string
  localStorage: LocalDB
  communityState: ServiceState
  registrarState: ServiceState
  isTorInit: TorInitState = TorInitState.NOT_STARTED

  constructor({ options, socketIOPort, httpTunnelPort, torControlPort, torAuthCookie, torResourcesPath, torBinaryPath }: IConstructor) {
    super()
    this.registration = new CertificateRegistration()
    this.options = {
      ...new ConnectionsManagerOptions(),
      ...options
    }

    this.torResourcesPath = torResourcesPath
    this.torBinaryPath = torBinaryPath
    this.torControlPort = torControlPort
    this.torAuthCookie = torAuthCookie

    this.socketIOPort = socketIOPort
    this.httpTunnelPort = httpTunnelPort
    this.quietDir = this.options.env?.appDataPath || QUIET_DIR_PATH
    this.connectedPeers = new Map()
    // this.localStorage = new LocalDB(this.quietDir)

    // Does it work?
    process.on('unhandledRejection', error => {
      console.error(error)
      throw new Error()
    })
    process.on('SIGINT', function () {
      // This is not graceful even in a single percent. we must close services first, not just kill process %
      log('\nGracefully shutting down from SIGINT (Ctrl-C)')
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
  }

  public readonly createAgent = (): Agent => {
    if (this.socksProxyAgent) return

    log(`Creating https proxy agent: ${this.httpTunnelPort}`)

    return createHttpsProxyAgent({
      port: this.httpTunnelPort, host: '127.0.0.1',
    })
  }

  public init = async () => {
    this.communityState = ServiceState.DEFAULT
    this.registrarState = ServiceState.DEFAULT

    this.localStorage = new LocalDB(this.quietDir)

    if (!this.httpTunnelPort) {
      this.httpTunnelPort = await getPort()
    }

    this.socksProxyAgent = this.createAgent()

    if (!this.tor) {
      await this.spawnTor()
    }

    if (!this.dataServer) {
      this.dataServer = new DataServer(this.socketIOPort)
      this.io = this.dataServer.io
      this.attachDataServerListeners()
      this.attachRegistrationListeners()
    }

    this.attachTorEventsListeners()

    // Libp2p event listeners
    this.on(Libp2pEvents.PEER_CONNECTED, (payload: { peers: string[] }) => {
      this.io.emit(SocketActionTypes.PEER_CONNECTED, payload)
    })
    this.on(Libp2pEvents.PEER_DISCONNECTED, (payload: NetworkDataPayload) => {
      this.io.emit(SocketActionTypes.PEER_DISCONNECTED, payload)
    })

    await this.dataServer.listen()

    this.io.on('connection', async() => {
      if (this.isTorInit === TorInitState.STARTED || this.isTorInit === TorInitState.STARTING) return
      this.isTorInit = TorInitState.STARTING
        if (this.torBinaryPath) {
          await this.tor.init()
          this.isTorInit = TorInitState.STARTED
        }
        await this.launchCommunityFromStorage()
    })
  }

  public async launchCommunityFromStorage () {
    if ([ServiceState.LAUNCHING, ServiceState.LAUNCHED].includes(this.communityState)) return
    log('launchCommunityFromStorage')
    const community = await this.localStorage.get(LocalDBKeys.COMMUNITY)
    if (community) {
      const sortedPeers = await this.localStorage.getSortedPeers(community.peers)
      if (sortedPeers.length > 0) {
        community.peers = sortedPeers
      }
      await this.localStorage.put(LocalDBKeys.COMMUNITY, community)
      await this.launchCommunity(community)
    }

    if (this.registrarState === ServiceState.LAUNCHED || this.registrarState === ServiceState.LAUNCHING) return
    const registrarData = await this.localStorage.get(LocalDBKeys.REGISTRAR)
    if (registrarData) {
      await this.registration.launchRegistrar(registrarData)
    }
  }

  public async closeAllServices(options: {saveTor: boolean} = { saveTor: false }) {
    if (this.tor && !this.torControlPort && !options.saveTor) {
      await this.tor.kill()
    }
    if (this.registration) {
      log('Stopping registration service')
      await this.registration.stop()
    }
    if (this.storage) {
      log('Stopping orbitdb')
      await this.storage.stopOrbitDb()
    }
    if (this.io) {
      log('Closing socket server')
      this.io.close()
    }
    if (this.localStorage) {
      log('Closing local storage')
      await this.localStorage.close()
    }
    if (this.libp2pInstance) {
      log('Stopping libp2p')
      await this.libp2pInstance.stop()
    }
  }

  public async leaveCommunity() {
    this.io.close()
    await this.closeAllServices({ saveTor: true })
    await this.purgeData()
    this.communityId = null
    this.storage = null
    this.libp2pInstance = null
    await this.init()
    }

    public async purgeData() {
      console.log('removing data')
      const dirsToRemove = fs.readdirSync(this.quietDir).filter(i => i.startsWith('Ipfs') || i.startsWith('OrbitDB') || i.startsWith('backendDB') || i.startsWith('Local Storage'))
      for (const dir of dirsToRemove) {
        removeFilesFromDir(path.join(this.quietDir, dir))
      }
  }

  public spawnTor = async () => {
    this.tor = new Tor({
      torPath: this.torBinaryPath,
      appDataPath: this.quietDir,
      httpTunnelPort: this.httpTunnelPort,
      authCookie: this.torAuthCookie,
      controlPort: this.torControlPort,
      options: {
        env: {
          LD_LIBRARY_PATH: this.torResourcesPath,
          HOME: os.homedir()
        },
        detached: true
      }
    })

    if (this.torControlPort) {
      this.tor.initTorControl()
      await this.launchCommunityFromStorage()
    } else if (this.torBinaryPath) {
      // Tor init will be executed on connection event
    } else {
      throw new Error('You must provide either tor control port or tor binary path')
    }
  }

  public createStorage = (peerId: string, communityId: string) => {
    log(`Creating storage for community: ${communityId}`)
    return new Storage(this.quietDir, communityId, {
      ...this.options,
      orbitDbDir: `OrbitDB${peerId}`,
      ipfsDir: `Ipfs${peerId}`
    })
  }

  public getNetwork = async () => {
    const ports = await getPorts()
    const hiddenService = await this.tor.createNewHiddenService({ targetPort: ports.libp2pHiddenService })
    await this.tor.destroyHiddenService(hiddenService.onionAddress.split('.')[0])
    const peerId: PeerId = await PeerId.create()

    log(`Created network for peer ${peerId.toString()}. Address: ${hiddenService.onionAddress}`)

    return {
      hiddenService,
      peerId: peerId.toJSON()
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
      log.error(`Creating network for community ${community.id} failed`, e)
      emitError(this.io, {
        type: SocketActionTypes.NETWORK,
        message: ErrorMessages.NETWORK_SETUP_FAILED,
        community: community.id
      })
      return
    }

    log(`Sending network data for ${community.id}`)

    const payload: ResponseCreateNetworkPayload = {
      community: {
        ...community,
        privateKey: network2.hiddenService.privateKey,
        registrarUrl: community.registrarUrl || network2.hiddenService.onionAddress.split('.')[0]
      },
      network
    }
    this.io.emit(SocketActionTypes.NETWORK, payload)
  }

  public async createCommunity(payload: InitCommunityPayload) {
    await this.launchCommunity(payload)
    log(`Created and launched community ${payload.id}`)
    this.io.emit(SocketActionTypes.NEW_COMMUNITY, { id: payload.id })
  }

  public async launchCommunity(payload: InitCommunityPayload) {
    if ([ServiceState.LAUNCHING, ServiceState.LAUNCHED].includes(this.communityState)) return

    this.communityState = ServiceState.LAUNCHING
    const communityData = await this.localStorage.get(LocalDBKeys.COMMUNITY)
    if (!communityData) {
      await this.localStorage.put(LocalDBKeys.COMMUNITY, payload)
    }

    try {
      await this.launch(payload)
    } catch (e) {
      log(`Couldn't launch community for peer ${payload.peerId.id}.`, e)
      emitError(this.io, {
        type: SocketActionTypes.COMMUNITY,
        message: ErrorMessages.COMMUNITY_LAUNCH_FAILED,
        community: payload.id
      })
      return
    }

    log(`Launched community ${payload.id}`)
    this.io.emit(SocketActionTypes.CONNECTION_PROCESS_INFO, ConnectionProcessInfo.LAUNCHED_COMMUNITY)
    this.communityId = payload.id
    this.communityState = ServiceState.LAUNCHED
    this.io.emit(SocketActionTypes.COMMUNITY, { id: payload.id })
  }

  public launch = async (payload: InitCommunityPayload): Promise<string> => {
    // Start existing community (community that user is already a part of)
    const ports = await getPorts()
    log(`Spawning hidden service for community ${payload.id}, peer: ${payload.peerId.id}`)
    this.io.emit(SocketActionTypes.CONNECTION_PROCESS_INFO, ConnectionProcessInfo.SPAWNING_HIDDEN_SERVICE)
    const onionAddress: string = await this.tor.spawnHiddenService({
      targetPort: ports.libp2pHiddenService,
      privKey: payload.hiddenService.privateKey
    })
    log(`Launching community ${payload.id}, peer: ${payload.peerId.id}`)

    const restoredRsa = await PeerId.createFromJSON(payload.peerId)
    const peerId = await peerIdFromKeys(restoredRsa.marshalPubKey(), restoredRsa.marshalPrivKey())

    const initStorageParams: InitStorageParams = {
      communityId: payload.id,
      peerId: peerId,
      onionAddress: onionAddress,
      targetPort: ports.libp2pHiddenService,
      peers: payload.peers,
      certs: payload.certs
    }
    return await this.initStorage(initStorageParams)
  }

  public initStorage = async (params: InitStorageParams): Promise<string> => {
    const peerIdB58string = params.peerId.toString()
    log(`Initializing storage for peer ${peerIdB58string}...`)
    this.io.emit(SocketActionTypes.CONNECTION_PROCESS_INFO, ConnectionProcessInfo.INITIALIZING_STORAGE)

    let peers = params.peers
    if (!peers || peers.length === 0) {
      peers = [this.createLibp2pAddress(params.onionAddress, peerIdB58string)]
    }

    const libp2pParams: InitLibp2pParams = {
      peerId: params.peerId,
      address: params.onionAddress,
      addressPort: 443,
      targetPort: params.targetPort,
      bootstrapMultiaddrs: peers,
      certs: params.certs
    }

    const libp2pObj = await this.initLibp2p(libp2pParams)

    this.storage = this.createStorage(peerIdB58string, params.communityId)

    this.attachStorageListeners()

    await this.storage.init(libp2pObj.libp2p, params.peerId)

    await this.storage.initDatabases()

    log(`Initialized storage for peer ${peerIdB58string}`)

    return libp2pObj.localAddress
  }

  private attachTorEventsListeners = () => {
    this.tor.on(SocketActionTypes.TOR_BOOTSTRAP_PROCESS, (data) => {
      this.io.emit(SocketActionTypes.TOR_BOOTSTRAP_PROCESS, data)
    })

    this.dataServer.on(SocketActionTypes.CONNECTION_PROCESS_INFO, (data) => {
      this.io.emit(SocketActionTypes.CONNECTION_PROCESS_INFO, data)
    })

    this.registration.on(SocketActionTypes.CONNECTION_PROCESS_INFO, (data) => {
      this.io.emit(SocketActionTypes.CONNECTION_PROCESS_INFO, data)
    })
  }

  private attachRegistrationListeners = () => {
    this.registration.on(RegistrationEvents.REGISTRAR_STATE, (payload: ServiceState) => {
      this.registrarState = payload
    })
    this.registration.on(SocketActionTypes.SAVED_OWNER_CERTIFICATE, payload => {
      this.io.emit(SocketActionTypes.SAVED_OWNER_CERTIFICATE, payload)
    })
    this.registration.on(RegistrationEvents.SPAWN_HS_FOR_REGISTRAR, async (payload) => {
      await this.tor.spawnHiddenService({
        targetPort: payload.port,
        privKey: payload.privateKey,
        virtPort: payload.targetPort
      })
    })
    this.registration.on(RegistrationEvents.ERROR, payload => {
      emitError(this.io, payload)
    })
    this.registration.on(SocketActionTypes.SEND_USER_CERTIFICATE, payload => {
      this.io.emit(SocketActionTypes.SEND_USER_CERTIFICATE, payload)
    })
    this.registration.on(RegistrationEvents.NEW_USER, async payload => {
      await this.storage.saveCertificate(payload)
    })
  }

  private attachDataServerListeners = () => {
    // Community
    this.dataServer.on(SocketActionTypes.LEAVE_COMMUNITY, async () => {
      await this.leaveCommunity()
    })
    this.dataServer.on(SocketActionTypes.CONNECTION, async () => {
      // Update Frontend with Initialized Communities
      if (this.communityId) {
        this.io.emit(SocketActionTypes.COMMUNITY, { id: this.communityId })
        this.io.emit(SocketActionTypes.CONNECTED_PEERS, Array.from(this.connectedPeers.keys()))
        await this.storage.loadAllCertificates()
        await this.storage.loadAllChannels()
      }
    })
    this.dataServer.on(SocketActionTypes.CREATE_NETWORK, async (args: Community) => {
      await this.createNetwork(args)
    })
    this.dataServer.on(SocketActionTypes.CREATE_COMMUNITY, async (args: InitCommunityPayload) => {
      await this.createCommunity(args)
    })
    this.dataServer.on(SocketActionTypes.LAUNCH_COMMUNITY, async (args: InitCommunityPayload) => {
      await this.launchCommunity(args)
    })
    // Registration
    this.dataServer.on(SocketActionTypes.LAUNCH_REGISTRAR, async (args: LaunchRegistrarPayload) => {
      if (this.registrarState === ServiceState.LAUNCHED || this.registrarState === ServiceState.LAUNCHING) return
      const communityData = await this.localStorage.get(LocalDBKeys.REGISTRAR)
      if (!communityData) {
        await this.localStorage.put(LocalDBKeys.REGISTRAR, args)
      }
      await this.registration.launchRegistrar(args)
    })
    this.dataServer.on(
      SocketActionTypes.SAVED_OWNER_CERTIFICATE,
      async (args: SaveOwnerCertificatePayload) => {
        const saveCertificatePayload: SaveCertificatePayload = {
          certificate: args.certificate,
          rootPermsData: args.permsData
        }
        await this.storage.saveCertificate(saveCertificatePayload)
      }
    )
    this.dataServer.on(
      SocketActionTypes.REGISTER_USER_CERTIFICATE,
      async (args: RegisterUserCertificatePayload) => {
        await this.registration.sendCertificateRegistrationRequest(
          args.serviceAddress,
          args.userCsr,
          args.communityId,
          120_000,
          this.socksProxyAgent
        )
      }
    )
    this.dataServer.on(
      SocketActionTypes.REGISTER_OWNER_CERTIFICATE,
      async (args: RegisterOwnerCertificatePayload) => {
        await this.registration.registerOwnerCertificate(args)
      }
    )

    // Public Channels
    this.dataServer.on(SocketActionTypes.CREATE_CHANNEL, async (args: CreateChannelPayload) => {
      await this.storage.subscribeToChannel(args.channel)
    })
    this.dataServer.on(SocketActionTypes.SEND_MESSAGE, async (args: SendMessagePayload) => {
      await this.storage.sendMessage(args.message)
    })
    this.dataServer.on(SocketActionTypes.ASK_FOR_MESSAGES, async (args: AskForMessagesPayload) => {
      await this.storage.askForMessages(args.channelAddress, args.ids)
    })

    // Files
    this.dataServer.on(SocketActionTypes.DOWNLOAD_FILE, async (metadata: FileMetadata) => {
      await this.storage.downloadFile(metadata)
    })
    this.dataServer.on(SocketActionTypes.UPLOAD_FILE, async (metadata: FileMetadata) => {
      await this.storage.uploadFile(metadata)
    })
    this.dataServer.on(SocketActionTypes.UPLOADED_FILE, async (args: FileMetadata) => {
      await this.storage.uploadFile(args)
    })
    this.dataServer.on(SocketActionTypes.CANCEL_DOWNLOAD, mid => {
      this.storage.cancelDownload(mid)
    })

    // Direct Messages
    this.dataServer.on(
      SocketActionTypes.INITIALIZE_CONVERSATION,
      async (address, encryptedPhrase) => {
        await this.storage.initializeConversation(address, encryptedPhrase)
      }
    )
    this.dataServer.on(SocketActionTypes.GET_PRIVATE_CONVERSATIONS, async () => {
      await this.storage.getPrivateConversations()
    })
    this.dataServer.on(
      SocketActionTypes.SEND_DIRECT_MESSAGE,
      async (channelAddress: string, messagePayload) => {
        await this.storage.sendDirectMessage(channelAddress, messagePayload)
      }
    )
    this.dataServer.on(
      SocketActionTypes.SUBSCRIBE_FOR_DIRECT_MESSAGE_THREAD,
      async (address: string) => {
        await this.storage.subscribeToDirectMessageThread(address)
      }
    )
    this.dataServer.on(
      SocketActionTypes.SUBSCRIBE_FOR_ALL_CONVERSATIONS,
      async (conversations: string[]) => {
        await this.storage.subscribeToAllConversations(conversations)
      }
    )

    this.dataServer.on(SocketActionTypes.CLOSE, async () => {
      await this.closeAllServices()
    })
  }

  private attachStorageListeners = () => {
    this.storage.on(SocketActionTypes.CONNECTION_PROCESS_INFO, (data) => {
      this.io.emit(SocketActionTypes.CONNECTION_PROCESS_INFO, data)
    })
    this.storage.on(StorageEvents.LOAD_CERTIFICATES, (payload: SendCertificatesResponse) => {
      this.io.emit(SocketActionTypes.RESPONSE_GET_CERTIFICATES, payload)
      this.registration.emit(RegistrationEvents.SET_CERTIFICATES, payload.certificates)
    })
    this.storage.on(StorageEvents.LOAD_PUBLIC_CHANNELS, (payload: ChannelsReplicatedPayload) => {
      this.io.emit(SocketActionTypes.CHANNELS_REPLICATED, payload)
    })
    this.storage.on(StorageEvents.LOAD_ALL_PRIVATE_CONVERSATIONS, payload => {
      this.io.emit(SocketActionTypes.RESPONSE_GET_PRIVATE_CONVERSATIONS, payload)
    })
    this.storage.on(StorageEvents.LOAD_MESSAGES, (payload: IncomingMessages) => {
      this.io.emit(SocketActionTypes.INCOMING_MESSAGES, payload)
    })
    this.storage.on(StorageEvents.SEND_MESSAGES_IDS, (payload: ChannelMessagesIdsResponse) => {
      if (payload.ids.length === 0) {
        return
      }
      this.io.emit(SocketActionTypes.SEND_MESSAGES_IDS, payload)
    })
    this.storage.on(
      StorageEvents.SET_CHANNEL_SUBSCRIBED,
      (payload: SetChannelSubscribedPayload) => {
        this.io.emit(SocketActionTypes.CHANNEL_SUBSCRIBED, payload)
      }
    )
    this.storage.on(StorageEvents.CREATED_CHANNEL, (payload: CreatedChannelResponse) => {
      this.io.emit(SocketActionTypes.CREATED_CHANNEL, payload)
    })
    this.storage.on(StorageEvents.REMOVE_DOWNLOAD_STATUS, (payload: RemoveDownloadStatus) => {
      this.io.emit(SocketActionTypes.REMOVE_DOWNLOAD_STATUS, payload)
    })
    this.storage.on(StorageEvents.UPLOADED_FILE, (payload: UploadFilePayload) => {
      this.io.emit(SocketActionTypes.UPLOADED_FILE, payload)
    })
    this.storage.on(StorageEvents.UPDATE_DOWNLOAD_PROGRESS, (payload: DownloadStatus) => {
      this.io.emit(SocketActionTypes.DOWNLOAD_PROGRESS, payload)
    })
    this.storage.on(StorageEvents.UPDATE_MESSAGE_MEDIA, (payload: FileMetadata) => {
      this.io.emit(SocketActionTypes.UPDATE_MESSAGE_MEDIA, payload)
    })
    this.storage.on(StorageEvents.LOAD_ALL_DIRECT_MESSAGES, payload => {
      if (payload.messages.length === 0) {
        return
      }
      this.io.emit(SocketActionTypes.RESPONSE_FETCH_ALL_DIRECT_MESSAGES, payload)
    })
    this.storage.on(StorageEvents.UPDATE_PEERS_LIST, (payload: StorePeerListPayload) => {
      this.io.emit(SocketActionTypes.PEER_LIST, payload)
    })
    this.storage.on(StorageEvents.SEND_PUSH_NOTIFICATION, (payload: PushNotificationPayload) => {
      this.io.emit(SocketActionTypes.PUSH_NOTIFICATION, payload)
    })
    this.storage.on(StorageEvents.CHECK_FOR_MISSING_FILES, (payload: CommunityId) => {
      this.io.emit(SocketActionTypes.CHECK_FOR_MISSING_FILES, payload)
    })
  }

  // REFACTORING: Move all the below methods to libp2p module
  public initLibp2p = async (
    params: InitLibp2pParams
  ): Promise<{ libp2p: Libp2p; localAddress: string }> => {
    const localAddress = this.createLibp2pAddress(params.address, params.peerId.toString())

    log(
      `Initializing libp2p for ${params.peerId.toString()}, bootstrapping with ${params.bootstrapMultiaddrs.length} peers`
    )
    this.io.emit(SocketActionTypes.CONNECTION_PROCESS_INFO, ConnectionProcessInfo.INITIALIZING_LIBP2P)
    const nodeParams: Libp2pNodeParams = {
      peerId: params.peerId,
      listenAddresses: [this.createLibp2pListenAddress(params.address)],
      agent: this.socksProxyAgent,
      localAddress: localAddress,
      cert: params.certs.certificate,
      key: params.certs.key,
      ca: params.certs.CA,
      targetPort: params.targetPort
    }
    const libp2p: Libp2p = await ConnectionsManager.createBootstrapNode(nodeParams)

    this.libp2pInstance = libp2p
    const dialInChunks = new ProcessInChunks<string>(params.bootstrapMultiaddrs, this.dialPeer)

    libp2p.addEventListener('peer:discovery', (peer) => {
      log(`${params.peerId.toString()} discovered ${peer.detail.id}`)
    })

    libp2p.addEventListener('peer:connect', async (peer) => {
      const remotePeerId = peer.detail.remotePeer.toString()
      log(`${params.peerId.toString()} connected to ${remotePeerId}`)

      // Stop dialing as soon as we connect to a peer
      dialInChunks.stop()

      this.connectedPeers.set(remotePeerId, DateTime.utc().valueOf())

      this.emit(Libp2pEvents.PEER_CONNECTED, {
        peers: [remotePeerId]
      })
    })

    libp2p.addEventListener('peer:disconnect', async (peer) => {
      const remotePeerId = peer.detail.remotePeer.toString()
      log(`${params.peerId.toString()} disconnected from ${remotePeerId}`)
      log(`${libp2p.getConnections().length} open connections`)

      const connectionStartTime = this.connectedPeers.get(remotePeerId)

      const connectionEndTime: number = DateTime.utc().valueOf()

      const connectionDuration: number = connectionEndTime - connectionStartTime

      this.connectedPeers.delete(remotePeerId)

      // Get saved peer stats from db
      const remotePeerAddress = peer.detail.remoteAddr.toString()
      const peerPrevStats = await this.localStorage.find(LocalDBKeys.PEERS, remotePeerAddress)
      const prev = peerPrevStats?.connectionTime || 0

      const peerStats: NetworkStats = {
        peerId: remotePeerId,
        connectionTime: prev + connectionDuration,
        lastSeen: connectionEndTime
      }

      // Save updates stats to db
      await this.localStorage.update(LocalDBKeys.PEERS, {
        [remotePeerAddress]: peerStats
      })

      this.emit(Libp2pEvents.PEER_DISCONNECTED, {
        peer: remotePeerId,
        connectionDuration,
        lastSeen: connectionEndTime
      })
    })

    await dialInChunks.process()

    log(`Initialized libp2p for peer ${params.peerId.toString()}`)

    return {
      libp2p,
      localAddress
    }
  }

  private dialPeer = async (peerAddress: string) => {
    await this.libp2pInstance.dial(new Multiaddr(peerAddress))
  }

  public static readonly createBootstrapNode = async (
    params: Libp2pNodeParams
  ): Promise<Libp2p> => {
    return await ConnectionsManager.defaultLibp2pNode(params)
  }

  public readonly createLibp2pAddress = (address: string, peerId: string): string => {
    return createLibp2pAddress(address, peerId)
  }

  public readonly createLibp2pListenAddress = (address: string): string => {
    return createLibp2pListenAddress(address)
  }

  private static readonly defaultLibp2pNode = async (params: Libp2pNodeParams): Promise<any> => {
    let lib: Libp2p

    try {
      lib = await createLibp2p({
        connectionManager: {
          minConnections: 3,
          maxConnections: 8,
          dialTimeout: 120_000,
          maxParallelDials: 10
        },
        peerId: params.peerId,
        addresses: {
          listen: params.listenAddresses
        },
        streamMuxers: [mplex()],
        connectionEncryption: [noise()],
        relay: {
          enabled: false,
          hop: {
            enabled: true,
            active: false
          }
        },
        transports: [
          webSockets({
            filter: all,
            websocket: {
              agent: params.agent,
              cert: params.cert,
              key: params.key,
              ca: params.ca
            },
            localAddress: params.localAddress,
            targetPort: params.targetPort,
            createServer: createServer
          })],
        // @ts-expect-error
        dht: kadDHT(),
        pubsub: gossipsub({ allowPublishToZeroPeers: true }),
      })
    } catch (err) {
      log.error('LIBP2P ERROR:', err)
    }
    return lib
  }
}
