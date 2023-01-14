import { Crypto } from '@peculiar/webcrypto'
import { Agent } from 'https'
import { HttpsProxyAgent } from 'https-proxy-agent'
import type { Libp2p, createLibp2p as l2l } from 'libp2p'
import type { bootstrap as bootstrapType } from '@libp2p/bootstrap'
import type { kadDHT as kadDHTType } from '@libp2p/kad-dht'

import { webSockets } from './websocketOverTor/index'
import { all } from './websocketOverTor/filters'

import { DateTime } from 'luxon'

import SocketIO from 'socket.io'
import * as os from 'os'
import path from 'path'
import fs from 'fs'
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
  StorePeerListPayload
} from '@quiet/state-manager'

import { ConnectionsManagerOptions } from '../common/types'
import {
  createLibp2pAddress,
  createLibp2pListenAddress,
  getPorts
} from '../common/utils'
import { QUIET_DIR_PATH } from '../constants'
import { Storage } from '../storage'
import { Tor } from '../torManager'
import { DataServer } from '../socket/DataServer'
import { EventEmitter } from 'events'
import logger from '../logger'
import getPort from 'get-port'
import { RegistrationEvents } from '../registration/types'
import { StorageEvents } from '../storage/types'
import { Libp2pEvents } from './types'
import PeerId, { JSONPeerId } from 'peer-id'
import { importDynamically } from './utils'

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
  bootstrapMultiaddrsList: string[]
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

let peerIdFromKeys = null
let createLibp2p = null
let noise = null
let gossipsub = null
let mplex = null
let bootstrap = null
let kadDHT = null
let createServer = null

void (async () => {
  const { peerIdFromKeys: peerIdFromKeysImported } = await importDynamically('@libp2p/peer-id/dist/src/index.js')
  const { createLibp2p: createLibp2pImported }: { createLibp2p: typeof l2l } = await importDynamically('libp2p/dist/src/index.js')
  const { noise: noiseImported } = await importDynamically('@chainsafe/libp2p-noise/dist/src/index.js')
  const { gossipsub: gossipsubImported } = await importDynamically('@chainsafe/libp2p-gossipsub/dist/src/index.js')
  const { mplex: mplexImported } = await importDynamically('@libp2p/mplex/dist/src/index.js')
  const { bootstrap: bootstrapImported }: { bootstrap: typeof bootstrapType } = await importDynamically('@libp2p/bootstrap/dist/src/index.js')
  const { kadDHT: kadDHTImported }: { kadDHT: typeof kadDHTType } = await importDynamically('@libp2p/kad-dht/dist/src/index.js')
  const { createServer: createServerImported } = await importDynamically('it-ws/dist/src/server.js')

  peerIdFromKeys = peerIdFromKeysImported
  createLibp2p = createLibp2pImported
  noise = noiseImported
  gossipsub = gossipsubImported
  mplex = mplexImported
  bootstrap = bootstrapImported
  kadDHT = kadDHTImported
  createServer = createServerImported
})()

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
  isRegistrarLaunched: boolean
  communityDataPath: string
  registrarDataPath: string
  torAuthCookie: string
  torControlPort: number
  torBinaryPath: string
  torResourcesPath: string

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
    this.communityDataPath = path.join(this.quietDir, 'communityData.json')
    this.registrarDataPath = path.join(this.quietDir, 'registrarData.json')
    this.isRegistrarLaunched = false

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

    return new HttpsProxyAgent({ port: this.httpTunnelPort, host: 'localhost' })
  }

  public init = async () => {
    if (!this.httpTunnelPort) {
      this.httpTunnelPort = await getPort()
    }

    this.socksProxyAgent = this.createAgent()

    await this.spawnTor()

    this.dataServer = new DataServer(this.socketIOPort)

    this.io = this.dataServer.io

    this.attachDataServerListeners()
    this.attachRegistrationListeners()

    // Libp2p event listeners
    this.on(Libp2pEvents.PEER_CONNECTED, (payload: { peers: string[] }) => {
      this.io.emit(SocketActionTypes.PEER_CONNECTED, payload)
    })
    this.on(Libp2pEvents.PEER_DISCONNECTED, (payload: NetworkDataPayload) => {
      this.io.emit(SocketActionTypes.PEER_DISCONNECTED, payload)
    })

    await this.dataServer.listen()

    // Below logic is temporary, we gonna move it to leveldb
    const communityPath = this.communityDataPath
    const registrarPath = this.registrarDataPath

    if (fs.existsSync(communityPath)) {
      const data = fs.readFileSync(communityPath)
      const dataObj = JSON.parse(data.toString())
      await this.launchCommunity(dataObj)
    }

    if (fs.existsSync(registrarPath)) {
      const data = fs.readFileSync(registrarPath)
      const dataObj = JSON.parse(data.toString())
      await this.registration.launchRegistrar(dataObj)
      this.isRegistrarLaunched = true
    }
  }

  public async closeAllServices() {
    if (this.tor && !this.torControlPort) {
      await this.tor.kill()
    }
    if (this.registration) {
      await this.registration.stop()
    }
    if (this.storage) {
      await this.storage.stopOrbitDb()
    }
    if (this.io) {
      this.io.close()
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
    } else if (this.torBinaryPath) {
      await this.tor.init()
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
    const path = this.communityDataPath
    const json = JSON.stringify(payload)
    if (!fs.existsSync(path)) {
      fs.writeFileSync(path, json)
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
    this.communityId = payload.id
    this.io.emit(SocketActionTypes.COMMUNITY, { id: payload.id })
  }

  public launch = async (payload: InitCommunityPayload): Promise<string> => {
    // Start existing community (community that user is already a part of)
    const ports = await getPorts()
    log(`Spawning hidden service for community ${payload.id}, peer: ${payload.peerId.id}`)
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

  private attachRegistrationListeners = () => {
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
      if (this.communityId) return
      await this.launchCommunity(args)
    })
    // Registration
    this.dataServer.on(SocketActionTypes.LAUNCH_REGISTRAR, async (args: LaunchRegistrarPayload) => {
      if (this.isRegistrarLaunched) return
      const path = this.communityDataPath
      const json = JSON.stringify(args)
      if (!fs.existsSync(path)) {
        fs.writeFileSync(path, json)
      }
      await this.registration.launchRegistrar(args)
      this.isRegistrarLaunched = true
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
    this.dataServer.on(SocketActionTypes.CANCEL_DOWNLOAD, async mid => {
      await this.storage.cancelDownload(mid)
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
      `Initializing libp2p for ${params.peerId.toString()}, bootstrapping with ${params.bootstrapMultiaddrs.length
      } peers`
    )

    const nodeParams: Libp2pNodeParams = {
      peerId: params.peerId,
      listenAddresses: [this.createLibp2pListenAddress(params.address)],
      agent: this.socksProxyAgent,
      localAddress: localAddress,
      cert: params.certs.certificate,
      key: params.certs.key,
      ca: params.certs.CA,
      bootstrapMultiaddrsList: params.bootstrapMultiaddrs,
      targetPort: params.targetPort
    }
    const libp2p = await ConnectionsManager.createBootstrapNode(nodeParams)

    this.libp2pInstance = libp2p

    libp2p.addEventListener('peer:discovery', (peer) => {
      log(`${params.peerId.toString()} discovered ${peer.detail.id}`)
    })

    libp2p.connectionManager.addEventListener('peer:connect', (peer) => {
      log(`${params.peerId.toString()} connected to ${peer.detail.id}`)
      this.connectedPeers.set(peer.detail.id, DateTime.utc().valueOf())

      this.emit(Libp2pEvents.PEER_CONNECTED, {
        peers: [peer.detail.id]
      })
    })

    libp2p.connectionManager.addEventListener('peer:disconnect', (peer) => {
      log(`${params.peerId.toString()} disconnected from ${peer.detail.id}`)

      const connectionStartTime = this.connectedPeers.get(peer.detail.id)

      const connectionEndTime: number = DateTime.utc().valueOf()

      const connectionDuration: number = connectionEndTime - connectionStartTime

      this.connectedPeers.delete(peer.detail.id)

      this.emit(Libp2pEvents.PEER_DISCONNECTED, {
        peer: peer.detail.id,
        connectionDuration,
        lastSeen: connectionEndTime
      })
    })

    log(`Initialized libp2p for peer ${params.peerId.toString()}`)

    return {
      libp2p,
      localAddress
    }
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
    let lib

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
        peerDiscovery: [
          bootstrap({
            list: params.bootstrapMultiaddrsList,
            timeout: 120_000, // in ms,
            tagName: 'bootstrap',
            tagValue: 50,
          })
        ],
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
        dht: kadDHT(),
        pubsub: gossipsub({ allowPublishToZeroPeers: true }),
      })
    } catch (err) {
      console.log('LIBP2P ERROR:', err)
    }

    return lib
  }
}
