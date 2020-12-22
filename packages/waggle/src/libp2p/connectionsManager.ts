import Libp2p from 'libp2p'
import { SocksProxyAgent } from 'socks-proxy-agent'
import Mplex from 'libp2p-mplex'
import { NOISE } from 'libp2p-noise'
import KademliaDHT from 'libp2p-kad-dht'
import Gossipsub from 'libp2p-gossipsub'
import PeerId from 'peer-id'
import WebsocketsOverTor from './websocketOverTor'
import { Chat, IMessage, IMessageCommit } from './chat'
import Multiaddr from 'multiaddr'
import PubsubPeerDiscovery from 'libp2p-pubsub-peer-discovery'
import Bootstrap from 'libp2p-bootstrap'
import { sleep } from '../sleep'
import Crypto from 'crypto'
import randomTimestamp from 'random-timestamps'
import { Git, State } from '../git/index'
import { gitP } from 'simple-git'
import multihashing from 'multihashing-async'
import crypto from 'crypto'
import { Request } from '../config/protonsRequestMessages'
import { message as socketMessage } from '../socket/events/message'
import { loadAllMessages } from '../socket/events/allMessages'
import { Mutex } from 'async-mutex'

interface IConstructor {
  host: string
  port: number
  agentPort: number
  agentHost: string
}

interface IChat {
  send(message: IMessage): Promise<void>
  sendNewMergeCommit(message: IMessageCommit): Promise<void>
}

interface IChatRoom {
  chatInstance: IChat,
  mutex: Mutex
}

interface ILibp2pStatus {
  address: string,
  peerId: string
}

interface IChannelSubscription {
  channelAddress: string,
  git: Git,
  io: any
}

export class ConnectionsManager {
  host: string
  port: number
  agentHost: string
  agentPort: number
  socksProxyAgent: any
  libp2p: null | Libp2p
  chatRooms: Map<string, IChatRoom>
  localAddress: string | null
  onionAddressesBook: Map<string, string>
  constructor({ host, port, agentHost, agentPort }: IConstructor) {
    this.host = host,
    this.port = port,
    this.agentPort = agentPort,
    this.agentHost = agentHost
    this.chatRooms = new Map()
    this.onionAddressesBook = new Map()
    this.localAddress = null
    process.on('unhandledRejection', (error) => {
      console.error(error)
      throw error
    })
    process.on('SIGINT', function () {
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
    const addrs = [
      `/dns4/${this.host}/tcp/${this.port}/ws`,
    ]

    const bootstrapMultiaddrs = [
<<<<<<< HEAD:src/libp2p/connectionsManager.ts
      '/dns4/igbsyx2bhppwc3c3gvntkbrxu3evskllyaf6n74drrhma57qaydnp7ad.onion/tcp/7788/ws/p2p/QmUXEz4fN7oTLFvK6Ee4bRDL3s6dp1VCuHogmrrKxUngWW'
=======
      '/dns4/lt34smw52qazw4ekhzdpkicb7jnoiyashk7izsom6xavnipdeh3obbqd.onion/tcp/7788/ws/p2p/QmUXEz4fN7oTLFvK6Ee4bRDL3s6dp1VCuHogmrrKxUngWW'
>>>>>>> master:src/connectionsManager.ts
    ]

    this.localAddress = `${addrs}/p2p/${peerId.toB58String()}`
    await this.createAgent()
    this.libp2p = await this.createBootstrapNode({ peerId, addrs, agent: this.socksProxyAgent, localAddr: this.localAddress, bootstrapMultiaddrsList: bootstrapMultiaddrs })
    await this.libp2p.start()
    this.libp2p.connectionManager.on('peer:connect', (connection) => {
      console.log('Connected to', connection.remotePeer.toB58String());
    });
    this.libp2p.connectionManager.on('peer:discovery', (peer) => {
      console.log(peer, 'peer discovery');
    })
    this.libp2p.connectionManager.on('peer:disconnect', (connection) => {
      console.log('Disconnected from', connection.remotePeer.toB58String());
    })
    return {
      address: `${addrs}/p2p/${peerId.toB58String()}`,
      peerId: peerId.toB58String()
    }
  }
  public subscribeForTopic = async ({ channelAddress, git, io }: IChannelSubscription) => {
    const mutex = new Mutex()
    const chat = new Chat(
      this.libp2p,
      channelAddress,
      async ({ from, message }) => {
        const release = await mutex.acquire()
        try {
        let peerRepositoryOnionAddress = this.onionAddressesBook.get(from)
        if (!peerRepositoryOnionAddress) {
          const onionAddressKey = await this.createOnionPeerId(from)
          peerRepositoryOnionAddress = await this.getOnionAddress(onionAddressKey)
          this.onionAddressesBook.set(from, peerRepositoryOnionAddress)
        }
        switch (message.type) {
          case Request.Type.SEND_MESSAGE:
            const currentHEAD = await git.getCurrentHEAD(channelAddress)
            socketMessage(io, { message: message.data, from: from })
            if (message.currentHEAD === currentHEAD) {
              await git.addCommit(message.channelId, message.id, message.raw, message.created, message.parentId)
            } else {
              const mergeTime = await git.pullChanges(this.onionAddressesBook.get(from), channelAddress)
              const orderedMessages = await git.loadAllMessages(channelAddress)
              loadAllMessages(io, orderedMessages)
              const newHead = await git.getCurrentHEAD(channelAddress)
              const mergeResult = message.currentHEAD === newHead
              if (!mergeResult) {
                const messagePayload = {
                  created: new Date(mergeTime),
                  parentId: (~~(Math.random() * 1e9)).toString(36) + Date.now(),
                  channelId: channelAddress,
                  currentHEAD: newHead
                }
                const chat = this.chatRooms.get(`${channelAddress}`)
                await chat.chatInstance.sendNewMergeCommit(messagePayload)
              }
            }
            break
          case Request.Type.MERGE_COMMIT_INFO:
            const head = await git.getCurrentHEAD(message.channelId)
            if (head !== message.currentHEAD && from !== this.libp2p.peerId.toB58String()) {
              await git.pullChanges(this.onionAddressesBook.get(from), message.channelId, message.created)
              const orderedMessages = await git.loadAllMessages(channelAddress)
              loadAllMessages(io, orderedMessages)
            }
            break
      }
      release()
      } catch (err) {
        console.log(err)
        release()
      }
    })
    this.chatRooms.set(channelAddress, { chatInstance: chat, mutex })
  }
  public connectToNetwork = async (target: string) => {
    console.log(`Attempting to dial ${target}`)
    await this.libp2p.dial(target, { localAddr: this.localAddress, remoteAddr: new Multiaddr(target) })
  }

  public createOnionPeerId = async (peerId: string) => {
    const key = new TextEncoder().encode(`onion${peerId.substring(0, 10)}`)
    const digest = await multihashing(key, 'sha2-256')
    return digest
  }

  public publishOnionAddress = async (key, onionAddress): Promise<void> => {
    await this.libp2p._dht.put(key, onionAddress)
  }

  public getOnionAddress = async (key: string): Promise<string> => {
    const onionAddress = await this.libp2p._dht.get(key)
    const onionAddressString = new TextDecoder('utf-8').decode(onionAddress)
    return onionAddressString
  }

  public sendMessage = async (channelAddress: string, git: Git, message: string): Promise<void> => {
    const chat = this.chatRooms.get(`${channelAddress}`)
    const release = await chat.mutex.acquire() 
    try {
      const currentHEAD = await git.getCurrentHEAD(channelAddress)
      const timestamp = new Date()
      console.log('sending message', message, currentHEAD)
      const messagePayload = {
        data: Buffer.from(message),
        created: new Date(timestamp),
        parentId: (~~(Math.random() * 1e9)).toString(36) + Date.now(),
        channelId: channelAddress,
        currentHEAD,
        signature: this.libp2p.peerId.toB58String()
      }
      await chat.chatInstance.send(messagePayload)
      release()
    } catch (err) {
      console.log(err)
      release()
    }
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
  private createBootstrapNode = ({ peerId, addrs, agent, localAddr, bootstrapMultiaddrsList }): Promise<Libp2p> => {
    return Libp2p.create({
      peerId,
      addresses: {
        listen: addrs
      },
      modules: {
        transport: [WebsocketsOverTor],
        // peerDiscovery: [Bootstrap],
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
              agent
            },
            localAddr
          },
        },
      },
    })
  }
}