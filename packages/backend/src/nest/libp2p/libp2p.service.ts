import { gossipsub } from '@chainsafe/libp2p-gossipsub'
import { noise } from '@chainsafe/libp2p-noise'
import { kadDHT } from '@libp2p/kad-dht'
import { mplex } from '@libp2p/mplex'
import { multiaddr } from '@multiformats/multiaddr'
import { Inject, Injectable } from '@nestjs/common'
import { createLibp2pAddress, createLibp2pListenAddress } from '@quiet/common'
import { ConnectionProcessInfo, type NetworkDataPayload, PeerId, SocketActionTypes } from '@quiet/types'
import crypto from 'crypto'
import { EventEmitter } from 'events'
import { Agent } from 'https'
import { createServer } from 'it-ws'
import { Libp2p, createLibp2p, Libp2pOptions } from 'libp2p'
import { preSharedKey } from 'libp2p/pnet'
import { DateTime } from 'luxon'
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import { toString as uint8ArrayToString } from 'uint8arrays/to-string'
import Logger from '../common/logger'
import { SERVER_IO_PROVIDER, SOCKS_PROXY_AGENT } from '../const'
import { ServerIoProviderTypes } from '../types'
import { webSockets } from '../websocketOverTor'
import { all } from '../websocketOverTor/filters'
import { Libp2pConnectedPeer, Libp2pEvents, Libp2pNodeParams, Libp2pPeerInfo } from './libp2p.types'
import { ProcessInChunksService } from './process-in-chunks.service'
import { peerIdFromString } from '@libp2p/peer-id'

const KEY_LENGTH = 32
export const LIBP2P_PSK_METADATA = '/key/swarm/psk/1.0.0/\n/base16/\n'

@Injectable()
export class Libp2pService extends EventEmitter {
  public libp2pInstance: Libp2p | null
  public connectedPeers: Map<string, Libp2pConnectedPeer> = new Map()
  public dialedPeers: Set<string> = new Set()
  private readonly logger = Logger(Libp2pService.name)
  constructor(
    @Inject(SERVER_IO_PROVIDER) public readonly serverIoProvider: ServerIoProviderTypes,
    @Inject(SOCKS_PROXY_AGENT) public readonly socksProxyAgent: Agent,
    private readonly processInChunksService: ProcessInChunksService<string>
  ) {
    super()
  }

  private dialPeer = async (peerAddress: string): Promise<boolean> => {
    const ma = multiaddr(peerAddress)
    const peerId = peerIdFromString(ma.getPeerId()!)

    const libp2pHasPeer = await this.libp2pInstance?.peerStore.has(peerId as any)
    const weHaveDialedPeer = this.dialedPeers.has(peerAddress)

    if (weHaveDialedPeer || libp2pHasPeer) {
      this.logger(`Skipping dial of ${peerAddress} because its already been dialed`)
      return true
    }
    this.dialedPeers.add(peerAddress)
    const connection = await this.libp2pInstance?.dial(multiaddr(peerAddress))

    if (connection) return true
    return false
  }

  public getCurrentPeerInfo = (): Libp2pPeerInfo => {
    return {
      dialed: Array.from(this.dialedPeers),
      connected: Array.from(this.connectedPeers.values()).map(peer => peer.address),
    }
  }

  public pause = async (): Promise<Libp2pPeerInfo> => {
    const peerInfo = this.getCurrentPeerInfo()
    await this.hangUpPeers(peerInfo.dialed)
    this.dialedPeers.clear()
    this.connectedPeers.clear()
    this.processInChunksService.pause()
    return peerInfo
  }

  public resume = async (peersToDial: string[]): Promise<void> => {
    this.processInChunksService.resume()
    if (peersToDial.length === 0) {
      this.logger('No peers to redial!')
      return
    }

    this.logger(`Redialing ${peersToDial.length} peers`)
    await this.redialPeers(peersToDial)
  }

  public readonly createLibp2pAddress = (address: string, peerId: string): string => {
    return createLibp2pAddress(address, peerId)
  }

  public readonly createLibp2pListenAddress = (address: string): string => {
    return createLibp2pListenAddress(address)
  }

  public static generateLibp2pPSK(key?: string) {
    /**
     * Based on 'libp2p/pnet' generateKey
     *
     * @param key: base64 encoded psk
     */
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
    this.logger('Hanging up on all peers')
    for (const peer of peers) {
      await this.hangUpPeer(peer)
    }
    this.logger('All peers hung up')
  }

  public async hangUpPeer(peerAddress: string) {
    this.logger('Hanging up on peer', peerAddress)
    try {
      const ma = multiaddr(peerAddress)
      const peerId = peerIdFromString(ma.getPeerId()!)

      this.logger('Hanging up connection on libp2p')
      await this.libp2pInstance?.hangUp(ma)

      this.logger('Removing peer from peer store')
      await this.libp2pInstance?.peerStore.delete(peerId as any)
    } catch (e) {
      this.logger.error(e)
    }
    this.logger('Clearing local data')
    this.dialedPeers.delete(peerAddress)
    this.connectedPeers.delete(peerAddress)
    this.logger('Done hanging up')
  }

  /**
   * Hang up existing peer connections and re-dial them. Specifically useful on
   * iOS where Tor receives a new port when the app resumes from background and
   * we want to close/re-open connections.
   */
  public async redialPeers(peersToDial?: string[]) {
    const dialed = peersToDial ?? Array.from(this.dialedPeers)
    const toDial = peersToDial ?? [...this.connectedPeers.keys(), ...this.dialedPeers]

    if (dialed.length === 0) {
      this.logger('No peers to redial!')
      return
    }

    this.logger(`Re-dialing ${dialed.length} peers`)

    // TODO: Sort peers
    await this.hangUpPeers(dialed)

    this.processInChunksService.updateQueue(toDial)
  }

  public async createInstance(params: Libp2pNodeParams, startDialImmediately: boolean = false): Promise<Libp2p> {
    this.logger(`Creating new libp2p instance`)
    if (this.libp2pInstance) {
      this.logger(`Libp2p instance already exists`)
      return this.libp2pInstance
    }

    let libp2p: Libp2p
    const maxParallelDials = 2

    try {
      const libp2pConfig: Libp2pOptions = {
        start: false,
        connectionManager: {
          minConnections: 5, // TODO: increase?
          maxConnections: 20, // TODO: increase?
          dialTimeout: 90_000,
          maxParallelDials,
          maxIncomingPendingConnections: 30,
          inboundConnectionThreshold: 30,
          inboundUpgradeTimeout: 45_000,
          autoDial: true, // It's a default but let's set it to have explicit information
        },
        peerId: params.peerId,
        addresses: {
          listen: params.listenAddresses,
        },
        connectionProtector: preSharedKey({
          psk: params.psk,
        }),
        streamMuxers: [mplex()],
        connectionEncryption: [noise()],
        relay: {
          enabled: false,
          hop: {
            enabled: true,
            active: false,
          },
        },
        // ping: {
        //   maxInboundStreams: 10,
        //   maxOutboundStreams: 10,
        //   timeout: 15_000
        // },
        // fetch: {
        //   maxInboundStreams: 10,
        //   maxOutboundStreams: 10,
        //   timeout: 15_000
        // },
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
        pubsub: gossipsub({
          allowPublishToZeroPeers: true,
          doPX: true,
        }),
      }
      libp2p = await createLibp2p(libp2pConfig)
    } catch (err) {
      this.logger.error('Create libp2p:', err)
      throw err
    }
    this.libp2pInstance = libp2p
    await this.afterCreation(params.peers, params.peerId, maxParallelDials, startDialImmediately)
    return libp2p
  }

  private async afterCreation(
    peers: string[],
    peerId: PeerId,
    maxParallelDials: number,
    startDialImmediately: boolean
  ) {
    if (!this.libp2pInstance) {
      this.logger.error('libp2pInstance was not created')
      throw new Error('libp2pInstance was not created')
    }

    this.logger(`Local peerId: ${peerId.toString()}`)
    this.on(Libp2pEvents.DIAL_PEERS, async (addresses: string[]) => {
      const nonDialedAddresses = addresses.filter(peerAddress => !this.dialedPeers.has(peerAddress))
      this.logger('Dialing', nonDialedAddresses.length, 'addresses')
      this.processInChunksService.updateQueue(nonDialedAddresses)
    })

    this.on(Libp2pEvents.INITIAL_DIAL, async () => {
      this.logger('Starting initial dial')
      this.processInChunksService.resume()
    })

    this.logger(`Initializing libp2p for ${peerId.toString()}, bootstrapping with ${peers.length} peers`)
    this.serverIoProvider.io.emit(SocketActionTypes.CONNECTION_PROCESS_INFO, ConnectionProcessInfo.INITIALIZING_LIBP2P)

    this.logger(`Initializing processInChunksService and adding ${peers.length} peers to dial initially`)
    this.processInChunksService.init({
      initialData: peers,
      processItem: this.dialPeer,
      startImmediately: startDialImmediately,
      chunkSize: maxParallelDials,
    })

    this.libp2pInstance.addEventListener('peer:discovery', peer => {
      this.logger(`${peerId.toString()} discovered ${peer.detail.id}`)
    })

    this.libp2pInstance.addEventListener('peer:connect', async peer => {
      const remotePeerId = peer.detail.remotePeer.toString()
      const localPeerId = peerId.toString()
      this.logger(`${localPeerId} connected to ${remotePeerId}`)

      const connectedPeer: Libp2pConnectedPeer = {
        address: peer.detail.remoteAddr.toString(),
        connectedAtSeconds: DateTime.utc().valueOf(),
      }
      this.connectedPeers.set(remotePeerId, connectedPeer)
      this.logger(`${localPeerId} is connected to ${this.connectedPeers.size} peers`)
      this.logger(`${localPeerId} has ${this.libp2pInstance?.getConnections().length} open connections`)

      this.emit(Libp2pEvents.PEER_CONNECTED, {
        peers: [remotePeerId],
      })
    })

    this.libp2pInstance.addEventListener('peer:disconnect', async peer => {
      const remotePeerId = peer.detail.remotePeer.toString()
      const localPeerId = peerId.toString()
      this.logger(`${localPeerId} disconnected from ${remotePeerId}`)
      if (!this.libp2pInstance) {
        this.logger.error('libp2pInstance was not created')
        throw new Error('libp2pInstance was not created')
      }
      this.logger(`${localPeerId} has ${this.libp2pInstance.getConnections().length} open connections`)

      const connectionStartTime: number = this.connectedPeers.get(remotePeerId)!.connectedAtSeconds
      if (!connectionStartTime) {
        this.logger.error(`No connection start time for peer ${remotePeerId}`)
        return
      }

      const connectionEndTime: number = DateTime.utc().valueOf()

      const connectionDuration: number = connectionEndTime - connectionStartTime

      this.connectedPeers.delete(remotePeerId)
      this.logger(`${localPeerId} is connected to ${this.connectedPeers.size} peers`)
      const peerStat: NetworkDataPayload = {
        peer: remotePeerId,
        connectionDuration,
        lastSeen: connectionEndTime,
      }
      this.emit(Libp2pEvents.PEER_DISCONNECTED, peerStat)
    })

    this.logger(`Initialized libp2p for peer ${peerId.toString()}`)
  }

  public async close(): Promise<void> {
    this.logger('Closing libp2p service')
    await this.libp2pInstance?.stop()
    this.processInChunksService.pause()
    this.libp2pInstance = null
    this.connectedPeers = new Map()
    this.dialedPeers = new Set()
  }
}
