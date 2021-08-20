import { SocksProxyAgent } from 'socks-proxy-agent'
import Mplex from 'libp2p-mplex'
import { NOISE } from 'libp2p-noise'
import KademliaDHT from 'libp2p-kad-dht'
import Gossipsub from 'libp2p-gossipsub'
import PeerId from 'peer-id'
import WebsocketsOverTor from './websocketOverTor'
import Multiaddr from 'multiaddr'
import Bootstrap from 'libp2p-bootstrap'
import multihashing from 'multihashing-async'
import { Storage } from '../storage'
import { createPaths } from '../utils'
import { Config, ZBAY_DIR_PATH } from '../constants'
import fs from 'fs'
import path from 'path'
import { ConnectionsManagerOptions, DataFromPems, IChannelInfo, IConstructor, ILibp2pStatus, IMessage } from '../common/types'
import fetch, { Response } from 'node-fetch'
import debug from 'debug'
import CustomLibp2p, { Libp2pType } from './customLibp2p'
import { Tor } from '../torManager'
import { CertificateRegistration } from '../registration'
import { EventTypesResponse } from '../socket/constantsReponse'

const log = Object.assign(debug('waggle:conn'), {
  error: debug('waggle:conn:err')
})

export class ConnectionsManager {
  host: string
  port: number
  agentHost: string
  agentPort: number
  socksProxyAgent: any
  libp2p: null | CustomLibp2p
  localAddress: string | null
  listenAddrs: string
  storage: Storage
  options: ConnectionsManagerOptions
  zbayDir: string
  io: any
  peerId: PeerId | null
  bootstrapMultiaddrs: string[]
  libp2pTransportClass: any
  trackerApi: any

  constructor({ host, port, agentHost, agentPort, options, io, storageClass }: IConstructor) {
    this.host = host
    this.port = port
    this.io = io
    this.agentPort = agentPort
    this.agentHost = agentHost
    this.localAddress = null
    this.options = {
      ...new ConnectionsManagerOptions(),
      ...options
    }
    this.zbayDir = this.options.env?.appDataPath || ZBAY_DIR_PATH
    const StorageCls = storageClass || Storage
    this.storage = new StorageCls(this.zbayDir, this.io, { ...this.options })
    this.peerId = null
    this.bootstrapMultiaddrs = this.getBootstrapMultiaddrs()
    this.listenAddrs = `/dns4/${this.host}/tcp/${this.port}/ws`
    this.libp2pTransportClass = options.libp2pTransportClass || WebsocketsOverTor // We use tor by default

    process.on('unhandledRejection', error => {
      console.error(error)
      throw new Error()
    })
    process.on('SIGINT', function () {
      log('\nGracefully shutting down from SIGINT (Ctrl-C)')
      process.exit(0)
    })
  }

  public readonly createAgent = () => {
    if (!this.agentPort || !this.agentHost) return

    log('Creating socks proxy agent')
    this.socksProxyAgent = new SocksProxyAgent({ port: this.agentPort, host: this.agentHost })
  }

  private readonly getBootstrapMultiaddrs = () => {
    if (this.options.bootstrapMultiaddrs.length > 0) {
      return this.options.bootstrapMultiaddrs
    }
    return [
      '/dns4/2lmfmbj4ql56d55lmv7cdrhdlhls62xa4p6lzy6kymxuzjlny3vnwyqd.onion/tcp/7788/ws/p2p/Qmak8HeMad8X1HGBmz2QmHfiidvGnhu6w6ugMKtx8TFc85'
    ]
  }

  protected readonly getPeerId = async (): Promise<PeerId> => {
    let peerId
    const peerIdKeyPath = path.join(this.zbayDir, Config.PEER_ID_FILENAME)
    if (!fs.existsSync(peerIdKeyPath)) {
      if (this.options.createPaths) {
        createPaths([this.zbayDir])
      }
      peerId = await PeerId.create()
      fs.writeFileSync(peerIdKeyPath, peerId.toJSON().privKey)
    } else {
      const peerIdKey = fs.readFileSync(peerIdKeyPath, { encoding: 'utf8' })
      peerId = PeerId.createFromPrivKey(peerIdKey)
    }
    return peerId
  }

  public initializeNode = async (staticPeerId?: PeerId): Promise<ILibp2pStatus> => {
    if (!staticPeerId) {
      this.peerId = await this.getPeerId()
    } else {
      this.peerId = staticPeerId
    }
    if (this.getBootstrapMultiaddrs().length === 0) {
      console.error('Libp2p needs bootstrap multiaddress!')
      return null
    }
    this.createAgent()
    this.localAddress = `${this.listenAddrs}/p2p/${this.peerId.toB58String()}`
    log('local address:', this.localAddress)
    log('bootstrapMultiaddrs:', this.bootstrapMultiaddrs)
    this.libp2p = await this.initLibp2p()
    return {
      address: this.localAddress,
      peerId: this.peerId.toB58String()
    }
  }

  public initLibp2p = async (): Promise<Libp2pType> => {
    const libp2p = ConnectionsManager.createBootstrapNode({
      peerId: this.peerId,
      listenAddrs: [this.listenAddrs],
      agent: this.socksProxyAgent,
      localAddr: this.localAddress,
      bootstrapMultiaddrsList: this.bootstrapMultiaddrs,
      transportClass: this.libp2pTransportClass
    })
    libp2p.connectionManager.on('peer:connect', async connection => {
      log('Connected to', connection.remotePeer.toB58String())
    })
    libp2p.on('peer:discovery', (peer: PeerId) => {
      log(`Discovered ${peer.toB58String()}`)
    })
    libp2p.connectionManager.on('peer:disconnect', connection => {
      log('Disconnected from', connection.remotePeer.toB58String())
    })
    return libp2p
  }

  public stopLibp2p = async () => {
    await this.libp2p.stop()
  }

  public subscribeForTopic = async (channelData: IChannelInfo) => {
    console.log('subscribeForTopic')
    await this.storage.subscribeForChannel(channelData.address, channelData)
  }

  public initStorage = async () => {
    await this.storage.init(this.libp2p, this.peerId)
  }

  public closeStorage = async () => {
    await this.storage.stopOrbitDb()
  }

  public updateChannels = async () => {
    await this.storage.updateChannels()
  }

  public askForMessages = async (channelAddress: string, ids: string[]) => {
    await this.storage.askForMessages(channelAddress, ids)
  }

  public loadAllMessages = async (channelAddress: string) => {
    this.storage.loadAllChannelMessages(channelAddress)
  }

  public saveCertificate = async (certificate: string) => {
    await this.storage.saveCertificate(certificate)
  }

  public connectToNetwork = async (target: string) => {
    log(`Attempting to dial ${target}`)
    await this.libp2p.dial(target, {
      localAddr: this.localAddress,
      remoteAddr: new Multiaddr(target)
    })
  }

  public createOnionPeerId = async (peerId: string) => {
    const key = new TextEncoder().encode(`onion${peerId.substring(0, 10)}`)
    const digest = await multihashing(key, 'sha2-256')
    return digest
  }

  public sendPeerId = () => {
    const payload = this.peerId?.toB58String()
    this.io.emit(EventTypesResponse.SEND_PEER_ID, payload)
  }

  public sendMessage = async (
    channelAddress: string,
    messagePayload: IMessage
  ): Promise<void> => {
    const { id, type, signature, createdAt, message, pubKey } = messagePayload
    const messageToSend = {
      id,
      type,
      signature,
      createdAt,
      message,
      channelId: channelAddress,
      pubKey
    }
    await this.storage.sendMessage(channelAddress, messageToSend)
  }

  // DMs

  public addUser = async (
    publicKey: string,
    halfKey: string
  ): Promise<void> => {
    log(`CONNECTIONS MANAGER: addUser - publicKey ${publicKey} and halfKey ${halfKey}`)
    await this.storage.addUser(publicKey, halfKey)
  }

  public initializeConversation = async (
    address: string,
    encryptedPhrase: string
  ): Promise<void> => {
    log(`INSIDE WAGGLE: ${encryptedPhrase}`)
    await this.storage.initializeConversation(address, encryptedPhrase)
  }

  public getAvailableUsers = async (): Promise<void> => {
    await this.storage.getAvailableUsers()
  }

  public getPrivateConversations = async (): Promise<void> => {
    await this.storage.getPrivateConversations()
  }

  public sendDirectMessage = async (
    channelAddress: string,
    messagePayload: string
  ): Promise<void> => {
    await this.storage.sendDirectMessage(channelAddress, messagePayload)
  }

  public subscribeForDirectMessageThread = async (address): Promise<void> => {
    await this.storage.subscribeForDirectMessageThread(address)
  }

  public subscribeForAllConversations = async (conversations: string[]): Promise<void> => {
    await this.storage.subscribeForAllConversations(conversations)
  }

  public setupRegistrationService = async (tor: Tor, hiddenServicePrivKey: string, dataFromPems: DataFromPems): Promise<CertificateRegistration> => {
    const certRegister = new CertificateRegistration(hiddenServicePrivKey, tor, this, dataFromPems)
    try {
      await certRegister.init()
    } catch (err) {
      log.error(`Couldn't initialize certificate registration service: ${err as string}`)
      return
    }
    try {
      await certRegister.listen()
    } catch (err) {
      log.error(`Certificate registration service couldn't start listening: ${err as string}`)
    }
    return certRegister
  }

  public registerUserCertificate = async (serviceAddress: string, userCsr: string) => {
    const response = await this.sendCertificateRegistrationRequest(serviceAddress, userCsr)
    switch (response.status) {
      case 200:
        break
      case 403:
        this.emitCertificateRegistrationError('Username already taken.')
        return
      default:
        this.emitCertificateRegistrationError('Registering username failed.')
        return
    }
    const certificate: string = await response.json()
    this.io.emit(EventTypesResponse.SEND_USER_CERTIFICATE, certificate)
  }

  public sendCertificateRegistrationRequest = async (serviceAddress: string, userCsr: string): Promise<Response> => {
    const options = {
      method: 'POST',
      body: JSON.stringify({ data: userCsr }),
      headers: { 'Content-Type': 'application/json' },
      agent: new SocksProxyAgent({ port: this.agentPort, host: this.agentHost })
    }
    try {
      return await fetch(serviceAddress + '/register', options)
    } catch (e) {
      console.error(e)
      throw e
    }
  }

  public emitCertificateRegistrationError(message: string) {
    this.io.emit(EventTypesResponse.CERTIFICATE_REGISTRATION_ERROR, message)
  }

  public static readonly createBootstrapNode = ({
    peerId,
    listenAddrs,
    agent,
    localAddr,
    bootstrapMultiaddrsList,
    transportClass
  }): Libp2pType => {
    return ConnectionsManager.defaultLibp2pNode({
      peerId,
      listenAddrs,
      agent,
      localAddr,
      bootstrapMultiaddrsList,
      transportClass
    })
  }

  private static readonly defaultLibp2pNode = ({
    peerId,
    listenAddrs,
    agent,
    localAddr,
    bootstrapMultiaddrsList,
    transportClass
  }): Libp2pType => {
    return new CustomLibp2p({
      peerId,
      addresses: {
        listen: listenAddrs
      },
      modules: {
        transport: [transportClass],
        peerDiscovery: [Bootstrap],
        streamMuxer: [Mplex],
        connEncryption: [NOISE],
        dht: KademliaDHT,
        pubsub: Gossipsub
      },
      config: {
        peerDiscovery: {
          [Bootstrap.tag]: {
            enabled: true,
            list: bootstrapMultiaddrsList // provide array of multiaddrs
          },
          autoDial: true
        },
        relay: {
          enabled: true,
          hop: {
            enabled: true,
            active: false
          }
        },
        dht: {
          enabled: true,
          randomWalk: {
            enabled: true
          }
        },
        transport: {
          [transportClass.name]: {
            websocket: {
              agent
            },
            localAddr
          }
        }
      }
    })
  }
}
