import Libp2p from 'libp2p'
import { SocksProxyAgent } from 'socks-proxy-agent'
import Mplex from 'libp2p-mplex'
import { NOISE } from 'libp2p-noise'
import KademliaDHT from 'libp2p-kad-dht'
import Gossipsub from 'libp2p-gossipsub'
import PeerId from 'peer-id'
import WebsocketsOverTor from './websocketOverTor'
import { Chat } from './chat'

interface IConstructor {
  host: string
  port: number
  agentPort: number
  agentHost: string
}

interface IChat {
  send(message: Buffer): Promise<void>
}

interface IChatRoom {
  chatInstance: IChat
}

interface IChannelSubscription {
  topic: string,
  channelAddress: string
}

export class ConnectionsManager {
  host: string
  port: number
  agentHost: string
  agentPort: number
  socksProxyAgent: any
  libp2p: null | Libp2p
  chatRooms: Map<string, IChatRoom>
  constructor({ host, port, agentHost, agentPort }: IConstructor) {
    this.host = host,
    this.port = port,
    this.agentPort = agentPort,
    this.agentHost = agentHost
    this.chatRooms = new Map()
    process.on('unhandledRejection', (error) => {
      console.error(error)
      throw error
    })
    process.on('SIGINT', function () {
      console.log('\nGracefully shutting down from SIGINT (Ctrl-C)')
      process.exit(0)
    })
  }
  private createAgent = async () => {
    this.socksProxyAgent = new SocksProxyAgent({ port: this.agentPort, host: this.agentHost })
  }
  public initializeNode = async () => {
    const peerId = await PeerId.create()
    const addrs = [
      `/dns4/${this.host}/tcp/${this.port}/ws`,
    ]
    await this.createAgent()
    this.libp2p = await this.createBootstrapNode({ peerId, addrs, agent: this.socksProxyAgent })
    await this.libp2p.start()
    this.libp2p.connectionManager.on('peer:connect', (connection) => {
      console.log('Connected to', connection.remotePeer.toB58String());
    });
    this.libp2p.connectionManager.on('peer:disconnect', (connection) => {
      console.log('Disconnected from', connection.remotePeer.toB58String());
    })
    return {
      address: `${addrs}/p2p/${peerId.toB58String()}`
    }
  }
  public subscribeForTopic = async ({ topic, channelAddress }: IChannelSubscription) => {
    const chat = new Chat(
      this.libp2p,
      topic,
      ({ from, message }) => {
        let fromMe = from === this.libp2p.peerId.toB58String();
        const user = from.substring(0, 6);
        console.info(
          `${fromMe ? '\\033[1A' : ''}${user}(${new Date(
            message.created
          ).toLocaleTimeString()}): ${message.data}`
        )
      }
    )
    this.chatRooms.set(channelAddress, { chatInstance: chat })
  }
  public connectToNetwork = async (target: string) => {
    console.log(`Attempting to dial ${target}`)
    await this.libp2p.dial(target)
  }
  public listenForInput = async (channelAddress: string): Promise<void> => {
    process.stdin.on('data', async (message) => {
      // Remove trailing newline
      message = message.slice(0, -1)
      const chat = this.chatRooms.get(`${channelAddress}`)
      // If there was a command, exit early
      try {
        // Publish the message
        await chat.chatInstance.send(message)
      } catch (err) {
        console.error('Could not publish chat', err)
      }
    })
  }
  private createBootstrapNode = ({ peerId, addrs, agent }): Promise<Libp2p> => {
    return Libp2p.create({
      peerId,
      addresses: {
        listen: addrs,
      },
      modules: {
        transport: [WebsocketsOverTor],
        streamMuxer: [Mplex],
        connEncryption: [NOISE],
        dht: KademliaDHT,
        pubsub: Gossipsub,
      },
      config: {
        relay: {
          enabled: true,
          hop: {
            enabled: true,
            active: false,
          },
        },
        dht: {
          enabled: true,
          randomWalk: {
            enabled: true,
          },
        },
        transport: {
          WebsocketsOverTor: {
            websocket: {
              agent,
            },
          },
        },
      },
    })
  }
}