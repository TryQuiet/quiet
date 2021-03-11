import Libp2p from 'libp2p'
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

interface IConstructor {
  host: string
  port: number
  agentPort: number
  agentHost: string
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
  libp2p: null | Libp2p
  localAddress: string | null
  storage: Storage

  constructor({ host, port, agentHost, agentPort }: IConstructor) {
    this.host = host
    this.port = port
    this.agentPort = agentPort
    this.agentHost = agentHost
    this.storage = new Storage()
    this.localAddress = null
    process.on('unhandledRejection', error => {
      console.error(error)
      throw error
    })
    process.on('SIGINT', function() {
      console.log('\nGracefully shutting down from SIGINT (Ctrl-C)')
      process.exit(0)
    })
  }
  private createAgent = async (): Promise<void> => {
    this.socksProxyAgent = new SocksProxyAgent({ port: this.agentPort, host: this.agentHost })
  }
  public initializeNode = async (staticPeerId?): Promise<ILibp2pStatus> => {
    let peerId
    if (!staticPeerId) {
      peerId = await PeerId.create()
    } else {
      peerId = staticPeerId
    }
    const addrs = [`/dns4/${this.host}/tcp/${this.port}/ws`]

    const bootstrapMultiaddrs = [
      '/dns4/v5nvvfcfpceu6z6hao576ecbfvxin5ahmpbf6rovxbks2kevdxusfayd.onion/tcp/7788/ws/p2p/Qmak8HeMad8X1HGBmz2QmHfiidvGnhu6w6ugMKtx8TFc85',
    ]

    this.localAddress = `${addrs}/p2p/${peerId.toB58String()}`
    await this.createAgent()
    this.libp2p = await this.createBootstrapNode({
      peerId,
      addrs,
      agent: this.socksProxyAgent,
      localAddr: this.localAddress,
      bootstrapMultiaddrsList: bootstrapMultiaddrs
    })

    this.libp2p.connectionManager.on('peer:connect', connection => {
      console.log('Connected to', connection.remotePeer.toB58String())
    })
    this.libp2p.connectionManager.on('peer:discovery', peer => {
      console.log(peer, 'peer discovery')
    })
    this.libp2p.connectionManager.on('peer:disconnect', connection => {
      console.log('Disconnected from', connection.remotePeer.toB58String())
    })
    await this.storage.init(this.libp2p)

    return {
      address: `${addrs}/p2p/${peerId.toB58String()}`,
      peerId: peerId.toB58String()
    }
  }
  public subscribeForTopic = async (channelAddress: string, io: any) => {
    await this.storage.subscribeForChannel(channelAddress, io)
  }

  public connectToNetwork = async (target: string) => {
    console.log(`Attempting to dial ${target}`)
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
    io: any,
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
    await this.storage.sendMessage(channelAddress, io, messageToSend)
  }

  // public startSendingMessages = async (channelAddress: string, git: Git): Promise<string> => {
  //   try {
  //     const chat = this.chatRooms.get(`${channelAddress}`)
  //     for(let i = 0; i <= 1000; i++) {
  //       const { state } = git.gitRepos.get(channelAddress)
  //       if (state === State.LOCKED) {
  //         await sleep(2500)
  //         console.log('locked')
  //         continue
  //       }
  //       const currentHEAD = await git.getCurrentHEAD(channelAddress)
  //       const randomBytes = Crypto.randomBytes(256)
  //       const timestamp = randomTimestamp()
  //       const messagePayload = {
  //         data: randomBytes,
  //         created: new Date(timestamp),
  //         parentId: (~~(Math.random() * 1e9)).toString(36) + Date.now(),
  //         channelId: channelAddress,
  //         currentHEAD,
  //         signature: this.libp2p.peerId.toB58String()
  //       }
  //       await chat.chatInstance.send(messagePayload)
  //       await sleep(2500)
  //     }
  //     return 'done'
  //     } catch (e) {
  //     console.error('ERROR', e)
  //     throw(e)
  //   }
  // }

  // public listenForInput = async (channelAddress: string): Promise<void> => {
  //   process.stdin.on('data', async (message) => {
  //     // Remove trailing newline
  //     message = message.slice(0, -1)
  //     const chat = this.chatRooms.get(`${channelAddress}`)
  //     // If there was a command, exit early
  //     try {
  //       // Publish the message
  //       console.log('ok')
  //       // await chat.chatInstance.send(message)
  //     } catch (err) {
  //       console.error('Could not publish chat', err)
  //     }
  //   })
  // }
  private createBootstrapNode = ({
    peerId,
    addrs,
    agent,
    localAddr,
    bootstrapMultiaddrsList
  }): Promise<Libp2p> => {
    return Libp2p.create({
      peerId,
      addresses: {
        listen: addrs
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
          }
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
