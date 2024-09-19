import { gossipsub } from '@chainsafe/libp2p-gossipsub'
import { noise } from '@chainsafe/libp2p-noise'
import { kadDHT } from '@libp2p/kad-dht'
import { mplex } from '@libp2p/mplex'
import { yamux } from '@chainsafe/libp2p-yamux'
import { type Libp2p } from '@libp2p/interface'
import { preSharedKey } from '@libp2p/pnet'
import { peerIdFromString } from '@libp2p/peer-id'
import { identify, identifyPush } from '@libp2p/identify'
import { multiaddr } from '@multiformats/multiaddr'
import { Inject, Injectable } from '@nestjs/common'
import { createLibp2pAddress, createLibp2pListenAddress } from '@quiet/common'
import { ConnectionProcessInfo, type NetworkDataPayload, PeerId, SocketActionTypes, type UserData } from '@quiet/types'
import { getUsersAddresses } from '../common/utils'
import crypto from 'crypto'
import { EventEmitter } from 'events'
import { Agent } from 'https'
import { createLibp2p } from 'libp2p'
import { DateTime } from 'luxon'
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import { toString as uint8ArrayToString } from 'uint8arrays/to-string'
import { SERVER_IO_PROVIDER, SOCKS_PROXY_AGENT } from '../const'
import { ServerIoProviderTypes } from '../types'
import { webSockets } from '../websocketOverTor'
import { Libp2pConnectedPeer, Libp2pEvents, Libp2pNodeParams } from './libp2p.types'
import { createLogger } from '../common/logger'
import * as filters from '@libp2p/websockets/filters'

const KEY_LENGTH = 32
export const LIBP2P_PSK_METADATA = '/key/swarm/psk/1.0.0/\n/base16/\n'

@Injectable()
export class Libp2pService extends EventEmitter {
  public libp2pInstance: Libp2p | null
  private dialQueue: string[]
  public connectedPeers: Map<string, Libp2pConnectedPeer>
  public dialedPeers: Set<string>

  private readonly logger = createLogger(Libp2pService.name)

  constructor(
    @Inject(SERVER_IO_PROVIDER) public readonly serverIoProvider: ServerIoProviderTypes,
    @Inject(SOCKS_PROXY_AGENT) public readonly socksProxyAgent: Agent
  ) {
    super()

    this.dialQueue = []
    this.connectedPeers = new Map()
    this.dialedPeers = new Set()
  }

  public dialPeer = async (peerAddress: string) => {
    this.logger.info(`Dialing peer address: ${peerAddress}`)

    if (!peerAddress.includes(this.libp2pInstance?.peerId.toString() ?? '')) {
      this.dialedPeers.add(peerAddress)
      try {
        await this.libp2pInstance?.dial(multiaddr(peerAddress))
      } catch (e) {
        this.logger.warn(`Failed to dial peer address: ${peerAddress}`, e)
        this.dialQueue.push(peerAddress)
      }
    } else {
      this.logger.warn('Not dialing self')
    }
  }

  public dialPeers = async (peerAddresses: string[]) => {
    this.logger.info('Dialing peer addresses', peerAddresses)

    for (const addr of peerAddresses) {
      await this.dialPeer(addr)
    }
  }

  /**
   * It doesn't look like libp2p redials peers if it fails to dial them the
   * first time, so we handle that. Even if we fail to dial a peer, we keep
   * retrying.
   */
  private redialPeersInBackground = () => {
    const peerAddrs = [...this.dialQueue]

    this.dialQueue = []

    for (const addr of peerAddrs) {
      this.dialPeer(addr)
    }

    // TODO: Implement exponential backoff for peers that fail to connect
    setTimeout(this.redialPeersInBackground.bind(this), 20000)
  }

  public dialUsers = async (users: UserData[]) => {
    const addrs = await getUsersAddresses(users.filter(x => x.peerId !== this.libp2pInstance?.peerId.toString()))

    await this.dialPeers(addrs)
  }

  public pause = async () => {
    await this.hangUpPeers(Array.from(this.dialedPeers))
    this.dialedPeers.clear()
    this.connectedPeers.clear()
    this.logger.info('Found the following peer info on pause: ', this.connectedPeers, this.dialedPeers)
  }

  public resume = async (peersToDial: string[]): Promise<void> => {
    if (peersToDial.length === 0) {
      this.logger.warn('No peers to redial!')
      return
    }

    this.logger.info(`Redialing ${peersToDial.length} peers`)
    await this.redialPeers(peersToDial)
  }

  public readonly createLibp2pAddress = (address: string, peerId: string): string => {
    return createLibp2pAddress(address, peerId)
  }

  public readonly createLibp2pListenAddress = (address: string): string => {
    return createLibp2pListenAddress(address)
  }

  /**
   * Based on 'libp2p/pnet' generateKey
   *
   * @param key: base64 encoded psk
   */
  public static generateLibp2pPSK(key?: string) {
    let psk

    if (key) {
      psk = Buffer.from(key, 'base64')
    } else {
      psk = crypto.randomBytes(KEY_LENGTH)
    }

    const base16StringKey = uint8ArrayToString(psk, 'base16')
    const fullKey = uint8ArrayFromString(LIBP2P_PSK_METADATA + base16StringKey)

    return { psk: psk.toString('base64'), fullKey }
  }

  public async hangUpPeers(peers: string[]) {
    this.logger.info('Hanging up on all peers')
    for (const peer of peers) {
      await this.hangUpPeer(peer)
    }
    this.logger.info('All peers hung up')
  }

  public async hangUpPeer(peerAddress: string) {
    this.logger.info('Hanging up on peer', peerAddress)
    try {
      const ma = multiaddr(peerAddress)
      const peerId = peerIdFromString(ma.getPeerId()!)

      this.logger.info('Hanging up connection on libp2p')
      await this.libp2pInstance?.hangUp(ma)

      this.logger.info('Removing peer from peer store')
      await this.libp2pInstance?.peerStore.delete(peerId as any)

      this.logger.info('Clearing local data')
      this.dialedPeers.delete(peerAddress)
      this.connectedPeers.delete(peerId.toString())
      this.logger.info('Done hanging up')
    } catch (e) {
      this.logger.error('Error while hanging up on peer', e)
    }
  }

  /**
   * Hang up existing peer connections and re-dial them. Specifically useful on
   * iOS where Tor receives a new port when the app resumes from background and
   * we want to close/re-open connections.
   */
  public async redialPeers(peersToDial?: string[]) {
    const dialed = peersToDial ?? Array.from(this.dialedPeers)
    const connectedAddrs = [...this.connectedPeers.values()].map(p => p.address)
    const toDial = peersToDial ?? [...connectedAddrs, ...this.dialedPeers]

    if (dialed.length === 0) {
      this.logger.info('No peers to redial!')
      return
    }

    this.logger.info(`Re-dialing ${dialed.length} peers`)

    // TODO: Sort peers
    await this.hangUpPeers(dialed)

    for (const addr of toDial) {
      this.dialPeer(addr)
    }
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
          minConnections: 3, // TODO: increase?
          maxConnections: 20, // TODO: increase?
          dialTimeout: 120_000,
          maxParallelDials: 10,
          inboundUpgradeTimeout: 60_000,
        },
        peerId: params.peerId,
        addresses: { listen: params.listenAddresses },
        connectionProtector: preSharedKey({ psk: params.psk }),
        streamMuxers: [yamux()],
        connectionEncryption: [noise()],
        transports: [
          webSockets({
            filter: filters.all,
            websocket: {
              agent: params.agent,
            },
            localAddress: params.localAddress,
            targetPort: params.targetPort,
          }),
        ],
        services: {
          dht: kadDHT({
            allowQueryWithZeroPeers: true,
          }),
          pubsub: gossipsub({
            // neccessary to run a single peer
            allowPublishToZeroTopicPeers: true,
            fallbackToFloodsub: true,
            doPX: true,
          }),
          identify: identify(),
          identifyPush: identifyPush(),
        },
      })
    } catch (err) {
      this.logger.error('Create libp2p:', err)
      throw err
    }
    this.libp2pInstance = libp2p
    await this.afterCreation(params.peerId)
    return libp2p
  }

  private async afterCreation(peerId: PeerId) {
    if (!this.libp2pInstance) {
      this.logger.error('libp2pInstance was not created')
      throw new Error('libp2pInstance was not created')
    }

    this.logger.info(`Local peerId: ${peerId.toString()}`)

    this.serverIoProvider.io.emit(SocketActionTypes.CONNECTION_PROCESS_INFO, ConnectionProcessInfo.INITIALIZING_LIBP2P)

    this.libp2pInstance.addEventListener('peer:discovery', peer => {
      this.logger.info(`${peerId.toString()} discovered ${peer.detail.id}`)
    })

    this.libp2pInstance.addEventListener('peer:connect', async event => {
      const remotePeerId = event.detail.toString()
      const localPeerId = peerId.toString()
      this.logger.info(`${localPeerId} connected to ${remotePeerId}`)

      const connectedPeers: Map<string, Libp2pConnectedPeer> = new Map()
      for (const conn of this.libp2pInstance?.getConnections() ?? []) {
        connectedPeers.set(conn.remotePeer.toString(), {
          address: conn.remoteAddr.toString(),
          connectedAtSeconds: DateTime.utc().valueOf(),
        })
      }
      this.connectedPeers = connectedPeers
      this.logger.info(`${localPeerId} is connected to ${this.connectedPeers.size} peers`)
      this.logger.info(`${localPeerId} has ${this.libp2pInstance?.getConnections().length} open connections`)

      this.emit(Libp2pEvents.PEER_CONNECTED, {
        peers: [remotePeerId],
      })
    })

    this.libp2pInstance.addEventListener('peer:disconnect', async event => {
      const remotePeerId = event.detail.toString()
      const localPeerId = peerId.toString()
      this.logger.info(`${localPeerId} disconnected from ${remotePeerId}`)
      if (!this.libp2pInstance) {
        this.logger.error('libp2pInstance was not created')
        throw new Error('libp2pInstance was not created')
      }
      this.logger.info(`${localPeerId} has ${this.libp2pInstance.getConnections().length} open connections`)

      const connectionStartTime: number = this.connectedPeers.get(remotePeerId)!.connectedAtSeconds
      if (!connectionStartTime) {
        this.logger.error(`No connection start time for peer ${remotePeerId}`)
        return
      }

      const connectionEndTime: number = DateTime.utc().valueOf()

      const connectionDuration: number = connectionEndTime - connectionStartTime

      this.connectedPeers.delete(remotePeerId)
      this.logger.info(`${localPeerId} is connected to ${this.connectedPeers.size} peers`)
      const peerStat: NetworkDataPayload = {
        peer: remotePeerId,
        connectionDuration,
        lastSeen: connectionEndTime,
      }
      this.emit(Libp2pEvents.PEER_DISCONNECTED, peerStat)
    })

    this.redialPeersInBackground()

    await this.libp2pInstance.start()

    this.logger.warn(
      `Libp2p Multiaddrs:`,
      this.libp2pInstance.getMultiaddrs().map(addr => addr.toString())
    )

    this.logger.info(`Initialized libp2p for peer ${peerId.toString()}`)
  }

  public async close(): Promise<void> {
    this.logger.info('Closing libp2p service')
    await this.libp2pInstance?.stop()
    this.libp2pInstance = null
    this.connectedPeers = new Map()
    this.dialedPeers = new Set()
  }
}
