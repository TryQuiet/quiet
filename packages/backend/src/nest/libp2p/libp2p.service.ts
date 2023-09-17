import { Inject, Injectable } from '@nestjs/common'

import { Agent } from 'https'
import { createLibp2p, Libp2p } from 'libp2p'
import { noise } from '@chainsafe/libp2p-noise'
import { gossipsub } from '@chainsafe/libp2p-gossipsub'
import { mplex } from '@libp2p/mplex'
import { kadDHT } from '@libp2p/kad-dht'
import { createServer } from 'it-ws'
import { DateTime } from 'luxon'
import { EventEmitter } from 'events'
import { Libp2pEvents, Libp2pNodeParams } from './libp2p.types'
import { ProcessInChunks } from './process-in-chunks'
import { multiaddr } from '@multiformats/multiaddr'
import { ConnectionProcessInfo, PeerId, SocketActionTypes } from '@quiet/types'
import { SERVER_IO_PROVIDER, SOCKS_PROXY_AGENT } from '../const'
import { ServerIoProviderTypes } from '../types'
import Logger from '../common/logger'
import { webSockets } from '../websocketOverTor'
import { all } from '../websocketOverTor/filters'
import { createLibp2pAddress, createLibp2pListenAddress } from '@quiet/common'

@Injectable()
export class Libp2pService extends EventEmitter {
  public libp2pInstance: Libp2p | null
  public connectedPeers: Map<string, number> = new Map()
  private readonly logger = Logger(Libp2pService.name)
  constructor(
    @Inject(SERVER_IO_PROVIDER) public readonly serverIoProvider: ServerIoProviderTypes,
    @Inject(SOCKS_PROXY_AGENT) public readonly socksProxyAgent: Agent
  ) {
    super()
  }

  private dialPeer = async (peerAddress: string) => {
    await this.libp2pInstance?.dial(multiaddr(peerAddress))
  }

  public readonly createLibp2pAddress = (address: string, peerId: string): string => {
    return createLibp2pAddress(address, peerId)
  }

  public readonly createLibp2pListenAddress = (address: string): string => {
    return createLibp2pListenAddress(address)
  }

  public async createInstance(params: Libp2pNodeParams): Promise<Libp2p> {
    if (this.libp2pInstance) {
      return this.libp2pInstance
    }

    let libp2p: Libp2p

    try {
      libp2p = await createLibp2p({
        start: false,
        connectionManager: {
          minConnections: 3,
          maxConnections: 8,
          dialTimeout: 120_000,
          maxParallelDials: 10,
        },
        peerId: params.peerId,
        addresses: {
          listen: params.listenAddresses,
        },
        streamMuxers: [mplex()],
        connectionEncryption: [noise()],
        relay: {
          enabled: false,
          hop: {
            enabled: true,
            active: false,
          },
        },
        transports: [
          webSockets({
            filter: all,
            websocket: {
              agent: params.agent,
            },
            localAddress: params.localAddress,
            targetPort: params.targetPort,
            createServer: createServer,
          }),
        ],
        dht: kadDHT(),
        pubsub: gossipsub({ allowPublishToZeroPeers: true }),
      })
    } catch (err) {
      this.logger.error('Create libp2p:', err)
      throw err
    }
    this.libp2pInstance = libp2p
    await this.afterCreation(params.peers, params.peerId)
    return libp2p
  }

  private async afterCreation(peers: string[], peerId: PeerId) {
    if (!this.libp2pInstance) {
      this.logger.error('libp2pInstance was not created')
      throw new Error('libp2pInstance was not created')
    }

    this.logger(`Initializing libp2p for ${peerId.toString()}, bootstrapping with ${peers.length} peers`)
    this.serverIoProvider.io.emit(SocketActionTypes.CONNECTION_PROCESS_INFO, ConnectionProcessInfo.INITIALIZING_LIBP2P)
    const dialInChunks = new ProcessInChunks<string>(peers, this.dialPeer)

    this.libp2pInstance.addEventListener('peer:discovery', peer => {
      this.logger(`${peerId.toString()} discovered ${peer.detail.id}`)
    })

    this.libp2pInstance.addEventListener('peer:connect', async peer => {
      const remotePeerId = peer.detail.remotePeer.toString()
      this.logger(`${peerId.toString()} connected to ${remotePeerId}`)

      // Stop dialing as soon as we connect to a peer
      dialInChunks.stop()

      this.connectedPeers.set(remotePeerId, DateTime.utc().valueOf())
      this.logger(`${this.connectedPeers.size} connected peers`)

      this.emit(Libp2pEvents.PEER_CONNECTED, {
        peers: [remotePeerId],
      })
    })

    this.libp2pInstance.addEventListener('peer:disconnect', async peer => {
      const remotePeerId = peer.detail.remotePeer.toString()
      this.logger(`${peerId.toString()} disconnected from ${remotePeerId}`)
      if (!this.libp2pInstance) {
        this.logger.error('libp2pInstance was not created')
        throw new Error('libp2pInstance was not created')
      }
      this.logger(`${this.libp2pInstance.getConnections().length} open connections`)

      const connectionStartTime = this.connectedPeers.get(remotePeerId)
      if (!connectionStartTime) {
        this.logger.error(`No connection start time for peer ${remotePeerId}`)
        return
      }

      const connectionEndTime: number = DateTime.utc().valueOf()

      const connectionDuration: number = connectionEndTime - connectionStartTime

      this.connectedPeers.delete(remotePeerId)
      this.logger(`${this.connectedPeers.size} connected peers`)

      this.emit(Libp2pEvents.PEER_DISCONNECTED, {
        peer: remotePeerId,
        connectionDuration,
        lastSeen: connectionEndTime,
      })
    })

    await dialInChunks.process()

    this.logger(`Initialized libp2p for peer ${peerId.toString()}`)
  }

  public async destroyInstance(): Promise<void> {
    this.libp2pInstance?.removeEventListener('peer:discovery')
    this.libp2pInstance?.removeEventListener('peer:connect')
    this.libp2pInstance?.removeEventListener('peer:disconnect')
    try {
      await this.libp2pInstance?.stop()
    } catch (error) {
      this.logger.error(error)
    }

    this.libp2pInstance = null
  }
}
