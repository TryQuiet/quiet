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
import { createPaths, fetchAbsolute } from '../utils'
import { Config, ZBAY_DIR_PATH } from '../constants'
import fs from 'fs'
import path from 'path'
import { IChannelInfo } from '../storage/storage'
import fetch from 'node-fetch'
import debug from 'debug'
import CustomLibp2p, { Libp2pType } from './customLibp2p'
const log = Object.assign(debug('waggle:conn'), {
  error: debug('waggle:conn:err')
})

class ConnectionsManagerOptions {
  env: {
    appDataPath?: string
  } = {}

  bootstrapMultiaddrs: string[] = []
  createPaths: boolean = true
}

interface IConstructor {
  host: string
  port: number
  agentPort: number
  agentHost: string
  options?: Partial<ConnectionsManagerOptions>
  io: any
}
interface IBasicMessage {
  id: string
  type: number
  signature: string
  createdAt: number
  r: number
  message: string
  typeIndicator: number
}

interface ILibp2pStatus {
  address: string
  peerId: string
}

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
  peerId: PeerId
  bootstrapMultiaddrs: string[]
  trackerApi: any

  constructor({ host, port, agentHost, agentPort, options, io }: IConstructor) {
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
    this.zbayDir = options?.env?.appDataPath || ZBAY_DIR_PATH
    this.storage = new Storage(this.zbayDir, this.io, { ...options })
    this.peerId = null
    this.bootstrapMultiaddrs = options.bootstrapMultiaddrs || this.defaultBootstrapMultiaddrs()
    this.listenAddrs = `/dns4/${this.host}/tcp/${this.port}/ws`
    this.trackerApi = fetchAbsolute(fetch)('http://okmlac2qjgo2577dkyhpisceua2phwxhdybw4pssortdop6ddycntsyd.onion:7788')

    process.on('unhandledRejection', error => {
      console.error(error)
      throw new Error()
    })
    process.on('SIGINT', function () {
      log('\nGracefully shutting down from SIGINT (Ctrl-C)')
      process.exit(0)
    })
  }

  private readonly createAgent = () => {
    this.socksProxyAgent = new SocksProxyAgent({ port: this.agentPort, host: this.agentHost })
  }

  private readonly defaultBootstrapMultiaddrs = () => {
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

  // private readonly getInitialPeers = async (): Promise<string[]> => {
  //   const options = {
  //     method: 'GET',
  //     agent: () => {
  //       return this.socksProxyAgent
  //     }
  //   }
  //   const response = await this.trackerApi('/peers', options)
  //   return response.json()
  // }

  // private readonly registerPeer = async (address: string): Promise<void> => {
  //   const options = {
  //     method: 'POST',
  //     body: JSON.stringify({ address: address }),
  //     headers: { 'Content-Type': 'application/json' },
  //     agent: () => {
  //       return this.socksProxyAgent
  //     }
  //   }
  //   await this.trackerApi('/register', options)
  // }

  public initializeNode = async (staticPeerId?: PeerId): Promise<ILibp2pStatus> => {
    if (!staticPeerId) {
      this.peerId = await this.getPeerId()
    } else {
      this.peerId = staticPeerId
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
    const libp2p = await ConnectionsManager.createBootstrapNode({
      peerId: this.peerId,
      listenAddrs: [this.listenAddrs],
      agent: this.socksProxyAgent,
      localAddr: this.localAddress,
      bootstrapMultiaddrsList: this.bootstrapMultiaddrs
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

  public loadAllMessages = (channelAddress: string) => {
    this.storage.loadAllChannelMessages(channelAddress)
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

  public sendMessage = async (
    channelAddress: string,
    messagePayload: IBasicMessage
  ): Promise<void> => {
    const { id, type, signature, r, createdAt, message, typeIndicator } = messagePayload
    const messageToSend = {
      id,
      type,
      signature,
      createdAt,
      r,
      message,
      typeIndicator,
      channelId: channelAddress
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

  public static readonly createBootstrapNode = ({
    peerId,
    listenAddrs,
    agent,
    localAddr,
    bootstrapMultiaddrsList
  }): Libp2pType => {
    return ConnectionsManager.defaultLibp2pNode({
      peerId,
      listenAddrs,
      agent,
      localAddr,
      bootstrapMultiaddrsList
    })
  }

  private static readonly defaultLibp2pNode = ({
    peerId,
    listenAddrs,
    agent,
    localAddr,
    bootstrapMultiaddrsList
  }): Libp2pType => {
    return new CustomLibp2p({
      peerId,
      addresses: {
        listen: listenAddrs
      },
      modules: {
        transport: [WebsocketsOverTor],
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
          WebsocketsOverTor: {
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
