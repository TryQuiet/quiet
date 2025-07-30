import { gossipsub } from '@chainsafe/libp2p-gossipsub'
import { noise, pureJsCrypto } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { mplex } from '@libp2p/mplex'
import { FaultTolerance } from '@libp2p/interface-transport'
import { identify, identifyPush } from '@libp2p/identify'
import { type Libp2p } from '@libp2p/interface'
import { kadDHT } from '@libp2p/kad-dht'
import { keychain } from '@libp2p/keychain'
import { peerIdFromString } from '@libp2p/peer-id'
import { ping } from '@libp2p/ping'
import { preSharedKey } from '@libp2p/pnet'
import * as filters from '@libp2p/websockets/filters'
import { createLibp2p } from 'libp2p'

import { isMultiaddr, multiaddr } from '@multiformats/multiaddr'
import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common'

import crypto from 'crypto'
import { EventEmitter } from 'events'
import { DateTime } from 'luxon'
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import { toString as uint8ArrayToString } from 'uint8arrays/to-string'

import { createLibp2pAddress, createLibp2pListenAddress } from '@quiet/common'
import { ConnectionProcessInfo, type NetworkDataPayload, NetworkStats, SocketEvents } from '@quiet/types'

import { LIBP2P_DB_PATH, SERVER_IO_PROVIDER } from '../const'
import { ServerIoProviderTypes } from '../types'
import { webSockets as webSocketsOverTor } from '../websocketOverTor'
import {
  CreatedLibp2pPeerId,
  DialPeerOptions,
  Libp2pConnectedPeer,
  Libp2pDatastorePrefix,
  Libp2pEvents,
  Libp2pNodeParams,
  Libp2pPeerInfo,
} from './libp2p.types'
import { createLogger } from '../common/logger'
import { Libp2pDatastore } from './libp2p.datastore'
import { UNKNOWN_THIS_PEER, WEBSOCKET_CIPHER_SUITE } from './libp2p.const'
import { libp2pAuth, Libp2pAuth } from './libp2p.auth'
import { SigChainService } from '../auth/sigchain.service'
import { LocalDbService } from '../local-db/local-db.service'
import { TimedQueue } from '../common/timed-queue'
import { defaultLogger } from './libp2p.logger'
import { QSSService } from '../qss/qss.service'

const CONNECTION_LIMIT = 20
const KEY_LENGTH = 32
export const LIBP2P_PSK_METADATA = '/key/swarm/psk/1.0.0/\n/base16/\n'

@Injectable()
export class Libp2pService extends EventEmitter implements OnModuleDestroy {
  public libp2pInstance: Libp2p | null
  private redialQueue: TimedQueue
  public connectedPeers: Map<string, Libp2pConnectedPeer>
  public dialedPeers: Set<string>
  public libp2pDatastore: Libp2pDatastore | null
  public localAddress: string
  private _connectedPeersInterval: NodeJS.Timeout
  private _dialQueueInterval: NodeJS.Timeout | null = null
  private authService: Libp2pAuth | undefined

  private logger = createLogger(Libp2pService.name)

  constructor(
    @Inject(SERVER_IO_PROVIDER) public readonly serverIoProvider: ServerIoProviderTypes,
    @Inject(LIBP2P_DB_PATH) public readonly datastorePath: string,
    private readonly sigchainService: SigChainService,
    private readonly localDbService: LocalDbService,
    private readonly qssService: QSSService
  ) {
    super()

    this.connectedPeers = new Map()
    this.dialedPeers = new Set()
    this.redialQueue = new TimedQueue({
      start: true,
      concurrency: 10,
      backoffFactor: 1.25,
      fuzzFactor: 0.05,
      baseDelayMs: 8_000,
      maxDelayMs: 20_000,
      rolloverAtMaxDelay: true,
    })

    // Catch issues with the connection to the frontend closing and causing issues with peer connections
    // by redialing after the new connection is established
    this.serverIoProvider.io.engine.on('connection_error', async err => {
      this.logger.error(
        'Server IO experienced a connection error with frontend',
        err.message,
        err.code,
        err.context,
        err
      )
      this.serverIoProvider.io.on('connection', async socket => {
        this.logger.warn('Redialing all known peers due to a server IO reconnect')
      })
    })
  }

  public onModuleDestroy() {
    this.logger.log('Module is being destroyed')
    this.redialQueue.stop(true)
    if (this._dialQueueInterval) {
      clearInterval(this._dialQueueInterval)
      this._dialQueueInterval = null
    }
    if (this._connectedPeersInterval) {
      clearInterval(this._connectedPeersInterval)
    }
  }

  public emit(event: string | symbol, ...args: any[]): boolean {
    this.logger.info(`Emitting event: ${event.toString()}`, args)
    if (
      event === Libp2pEvents.AUTH_DISCONNECTED &&
      args[0].event != null &&
      ['LOCAL_ERROR', 'REMOTE_ERROR', 'ERROR'].includes(args[0].event.type)
    ) {
      this.logger.trace('Got an auth error on disconnect')
      try {
        const innerEvent = args[0].event
        // Check for errors related to ephemeral LFA connection isseus that warrant a redial attempt
        const redial =
          (innerEvent.type === 'ERROR' &&
            innerEvent.payload.type === 'DEVICE_UNKNOWN' &&
            innerEvent.payload.message === UNKNOWN_THIS_PEER) ||
          (innerEvent.type === 'LOCAL_ERROR' && innerEvent.payload.type === 'TIMEOUT')

        const remotePeerId = args[0].connection?.remotePeerId?.toString() ?? args[0].connection?.remotePeer?.toString()
        this.logger.trace('Got this peer ID from this auth connection', remotePeerId)
        const peerAddress = this.connectedPeers.get(remotePeerId)?.address
        if (peerAddress) {
          this.hangUpPeer(peerAddress, redial)
        } else {
          this.logger.warn(
            `No peer address associated with this peer's connection, can't hang up or redial`,
            remotePeerId
          )
        }
      } catch (e) {
        this.logger.error('Error while deciding to redial', e)
      }
    }
    return super.emit(event, ...args)
  }

  /**
   * Redial a given peer after a delay
   *
   * @param peerAddress Peer address to redial
   */
  public redialPeerAfterDelay = async (peerAddress: string): Promise<void> => {
    await this.redialQueue.enqueue({
      key: peerAddress,
      task: async (): Promise<void> => {
        await this.dialPeer(peerAddress, { throwOnError: true, redialOnError: false })
      },
    })
  }

  public dialPeer = async (
    peerAddress: string,
    options: DialPeerOptions = { throwOnError: false, redialOnError: true }
  ) => {
    const peerId = peerAddress.split('/').pop()!
    if (this.connectedPeers.has(peerId)) {
      // this.logger.debug(`Already connected to peer address: ${peerAddress}`)
      return
    }
    // this.logger.debug(`Dialing peer address: ${peerAddress}`)
    if (!peerAddress.includes(this.libp2pInstance?.peerId.toString() ?? '')) {
      try {
        this.dialedPeers.add(peerAddress)
        const parsedMultiAddr = multiaddr(peerAddress)
        if (!isMultiaddr(parsedMultiAddr)) {
          this.logger.error(`Invalid multiaddr: ${peerAddress}`)
          return
        }
        await this.libp2pInstance?.dial(parsedMultiAddr)
      } catch (e) {
        // let errorContext: Error | string = e
        if (!e.message.includes('Unexpected server response: 404')) {
          // errorContext = e.message
          this.logger.warn(`Failed to dial peer address: ${peerAddress}`, e)
        }
        if (options.redialOnError) {
          await this.redialPeerAfterDelay(peerAddress)
        }
        if (options.throwOnError) {
          throw e
        }
      }
    } else {
      this.logger.debug('Not dialing self')
    }
  }

  public dialPeers = async (peerAddresses: string[]) => {
    const dialable = peerAddresses.filter(p => p !== this.localAddress)
    this.logger.info('Dialing peer addresses', dialable)
    this.logger.info('Local Address', this.localAddress)
    this.logger.info(peerAddresses.length, dialable.length)

    for (const addr of dialable) {
      this.dialPeer(addr)
    }
  }

  public addPeersToDialQueue = async () => {
    let sortedPeers: string[]
    try {
      sortedPeers = await this.localDbService.getSortedPeers(false)
    } catch {
      this.logger.info('No peers to dial')
      return
    }

    for (const addr of sortedPeers) {
      const peerId = addr.split('/').pop()!
      if (addr === this.localAddress) continue
      if (this.redialQueue.hasTask(addr)) continue
      if (this.connectedPeers.has(peerId)) continue

      await this.redialQueue.enqueue({
        key: addr,
        delayMs: 0, // first attempt immediately
        task: async () => this.dialPeer(addr, { throwOnError: true, redialOnError: true }),
      })
    }
  }

  /**
   * Ensure the dial queue interval is set up and running. If already set, does nothing.
   * Optionally allows forcing a reset.
   */
  private ensureDialQueueInterval(force = false) {
    if (this._dialQueueInterval && !force) return
    if (this._dialQueueInterval) {
      clearInterval(this._dialQueueInterval)
    }
    this._dialQueueInterval = setInterval(() => {
      this.addPeersToDialQueue().catch(err => {
        this.logger.warn('Error replenishing dial queue', err)
      })
    }, 30_000) // every 30 seconds
  }

  public getCurrentPeerInfo = (): Libp2pPeerInfo => {
    return {
      dialed: Array.from(this.dialedPeers),
      connected: Array.from(this.connectedPeers.values()).map(peer => peer.address),
    }
  }

  public pauseDialQueue = () => {
    this.redialQueue.stop(true)
    if (this._dialQueueInterval) {
      clearInterval(this._dialQueueInterval)
      this._dialQueueInterval = null
    }
  }

  public resumeDialQueue = () => {
    this.redialQueue.start()
    this.ensureDialQueueInterval()
  }

  public pause = async (): Promise<Libp2pPeerInfo> => {
    this.logger.info('Pausing libp2p')
    this.pauseDialQueue()
    const peerInfo = this.getCurrentPeerInfo()
    await this.hangUpPeers()
    this.dialedPeers.clear()
    this.connectedPeers.clear()
    // await this.libp2pInstance?.stop()
    await this.libp2pDatastore?.deleteKeysByPrefix(Libp2pDatastorePrefix.PEERS)
    return peerInfo
  }

  public resume = async (peersToDial?: string[]): Promise<void> => {
    this.logger.info('Resuming libp2p')
    // await this.libp2pInstance?.start()
    if (peersToDial && peersToDial.length > 0) {
      this.logger.info(`Redialing ${peersToDial.length} peers`)
      await this.redialPeers(peersToDial)
    }
    this.resumeDialQueue()
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
    let psk: Buffer | undefined = undefined

    if (key) {
      psk = Buffer.from(key, 'base64')
    } else {
      psk = crypto.randomBytes(KEY_LENGTH)
    }

    const base16StringKey = uint8ArrayToString(psk, 'base16')
    const fullKey = uint8ArrayFromString(LIBP2P_PSK_METADATA + base16StringKey)

    return { psk: psk.toString('base64'), fullKey }
  }

  public async hangUpPeers(peers?: string[]) {
    const peersToHangUp = peers ?? Array.from(this.connectedPeers.values()).map(peer => peer.address)
    this.logger.info('Hanging up on all peers')
    for (const peer of peersToHangUp) {
      await this.hangUpPeer(peer)
    }
    this.logger.info('All peers hung up')
  }

  public async hangUpPeer(peerAddress: string, redial = false) {
    this.logger.info('Hanging up on peer', peerAddress)
    const controller = new AbortController()
    try {
      const ma = multiaddr(peerAddress)
      const peerId = peerIdFromString(ma.getPeerId()!)

      this.logger.info('Disconnecting auth service gracefully')
      this.authService?.closeAuthConnection(peerId)

      this.logger.info('Hanging up connection on libp2p')
      await this.libp2pInstance?.hangUp(ma, { signal: controller.signal })

      this.logger.info('Removing peer from peer store')
      await this.libp2pInstance?.peerStore.delete(peerId as any)

      this.logger.info('Clearing local data')
      this.dialedPeers.delete(peerAddress)
      this.logger.info('Done hanging up')
    } catch (e) {
      this.logger.error('Error while hanging up on peer', e)
      if (!controller.signal.aborted) {
        controller.abort(e)
      }
    }

    if (redial) {
      await this.redialPeerAfterDelay(peerAddress)
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

    await this.dialPeers(toDial)
  }

  public async createInstance(params: Libp2pNodeParams): Promise<Libp2p> {
    if (params.instanceName != null) {
      this.logger = this.logger.extend(params.instanceName)
    }
    this.logger.info(`Creating new libp2p instance`)

    if (this.libp2pInstance) {
      this.logger.warn(`Found an existing instance of libp2p, returning...`)
      return this.libp2pInstance
    }

    this.logger.info(`Creating or opening existing level datastore for libp2p`)
    this.libp2pDatastore = new Libp2pDatastore({
      inMemory: true,
      datastorePath: this.datastorePath,
    })

    this.localAddress = params.localAddress

    let libp2p: Libp2p

    this.logger.info(`Creating libp2p`)
    try {
      libp2p = await createLibp2p({
        start: false,
        logger: defaultLogger(),
        datastore: this.libp2pDatastore.init(),
        connectionManager: {
          maxConnections: CONNECTION_LIMIT, // TODO: increase?
          dialTimeout: 120_000,
          maxParallelDials: 10,
          inboundUpgradeTimeout: 60_000,
          outboundUpgradeTimeout: 60_000,
          protocolNegotiationTimeout: 20_000,
          maxDialQueueLength: 500,
          reconnectRetries: 0,
        },
        privateKey: params.peerId.privKey,
        addresses: { listen: params.listenAddresses },
        connectionMonitor: {
          // ISLA: we should consider making this true if pings are reliable going forward
          abortConnectionOnPingFailure: false,
          pingInterval: 60_000,
          enabled: false,
        },
        connectionProtector:
          params.useConnectionProtector || params.useConnectionProtector == null
            ? preSharedKey({ psk: params.psk })
            : undefined,
        streamMuxers: [
          yamux({
            maxInboundStreams: 1024,
            maxOutboundStreams: 1024,
            maxMessageSize: 10485760,
          }),
          mplex({
            disconnectThreshold: 20,
            maxInboundStreams: 1024,
            maxOutboundStreams: 1024,
            maxStreamBufferSize: 26214400,
            maxUnprocessedMessageQueueSize: 104857600,
            maxMsgSize: 10485760,
            // @ts-expect-error This is part of the config interface but it isn't typed that way
            closeTimeout: 15_000,
          }),
        ],
        // @ts-ignore
        connectionEncrypters: [noise({ crypto: pureJsCrypto })],
        transports: params.transport
          ? params.transport
          : [
              webSocketsOverTor({
                filter: filters.all,
                websocket: {
                  agent: params.agent,
                  handshakeTimeout: 60_000,
                  ciphers: WEBSOCKET_CIPHER_SUITE,
                  followRedirects: true,
                },
                localAddress: params.localAddress,
                targetPort: params.targetPort,
                inboundConnectionUpgradeTimeout: 60_000,
                closeOnEnd: true,
              }),
            ],
        transportManager: {
          faultTolerance: FaultTolerance.NO_FATAL,
        },
        services: {
          auth: libp2pAuth(this.sigchainService, this.qssService, this),
          ping: ping({ timeout: 30_000 }),
          pubsub: gossipsub({
            // neccessary to run a single peer
            allowPublishToZeroTopicPeers: true,
            fallbackToFloodsub: false,
            emitSelf: true,
            debugName: params.peerId.peerId.toString(),
            doPX: true,
          }),
          identify: identify({ timeout: 30_000, maxInboundStreams: 128, maxOutboundStreams: 128 }),
          identifyPush: identifyPush({ timeout: 30_000, maxInboundStreams: 128, maxOutboundStreams: 128 }),
          dht: kadDHT({
            allowQueryWithZeroPeers: true,
            clientMode: true,
            initialQuerySelfInterval: 500,
            providers: {
              cacheSize: 1024,
            },
            maxInboundStreams: 128,
            maxOutboundStreams: 128,
          }),
        },
      })
    } catch (err) {
      this.logger.error('Error while creating instance of libp2p', err)
      throw err
    }

    this.libp2pInstance = libp2p
    const maybeAuth = libp2p.services['auth']
    if (maybeAuth != null) {
      this.authService = maybeAuth as Libp2pAuth
    }
    await this.afterCreation(params.peerId)
    return libp2p
  }

  private async afterCreation(peerId: CreatedLibp2pPeerId) {
    this.logger.info(`Performing post-creation setup of libp2p instance`)

    if (!this.libp2pInstance) {
      this.logger.error('libp2pInstance was not created')
      throw new Error('libp2pInstance was not created')
    }

    this.logger.info(`Local peerId: ${peerId.peerId.toString()}`)
    this.logger.info(`Setting up libp2p event listeners`)

    this.serverIoProvider.io.emit(SocketEvents.CONNECTION_PROCESS_INFO, ConnectionProcessInfo.INITIALIZING_LIBP2P)

    this.libp2pInstance.addEventListener('connection:open', openEvent => {
      this.logger.info(
        `Opened connection with ID ${openEvent.detail.id} with peer`,
        openEvent.detail.remotePeer.toString()
      )
    })

    this.libp2pInstance.addEventListener('peer:identify', async event => {
      const identifyResult = event.detail
      this.logger.info(`Identified peer`, identifyResult.peerId.toString())
      // if ((await this.libp2pInstance?.peerStore?.get(identifyResult.peerId))?.tags.has(KEEP_ALIVE)) {
      //   return
      // }

      // await this.libp2pInstance?.peerStore?.patch(identifyResult.peerId, {
      //   tags: {
      //     [KEEP_ALIVE]: {},
      //   },
      // })
    })

    this.libp2pInstance.addEventListener('peer:discovery', peer => {
      this.logger.info(`${peerId.peerId.toString()} discovered ${peer.detail.id}`)
    })

    this.libp2pInstance.addEventListener('connection:close', event => {
      this.logger.warn(`Connection with ID ${event.detail.id} closing with peer`, event.detail.remotePeer.toString())
    })

    this.libp2pInstance.addEventListener('transport:close', event => {
      this.logger.info(`Transport closing`)
    })

    this.libp2pInstance.addEventListener('peer:connect', async event => {
      const remotePeerId = event.detail.toString()
      const localPeerId = peerId.peerId.toString()
      const connection = this.libp2pInstance?.getConnections(event.detail)
      this.logger.info(`Connection established with ${remotePeerId}`, JSON.stringify(connection))
      this.logger.info(`${localPeerId} connected to ${remotePeerId}`)

      // update peer stats
      const peerPrevStats = await this.localDbService.getPeerStats(remotePeerId)
      const peerStats: Record<string, NetworkStats> = {}
      peerStats[remotePeerId] = {
        peerId: remotePeerId,
        connectionTime: peerPrevStats?.connectionTime ?? 0,
        lastSeen: DateTime.utc().valueOf(),
      } as NetworkStats
      await this.localDbService.updatePeerStats(peerStats)

      if (connection) {
        const remoteAddr = connection[0].remoteAddr.toString()
        this.connectedPeers.set(remotePeerId, {
          peerId: remotePeerId,
          address: remoteAddr,
          connectedAtSeconds: DateTime.utc().toSeconds(),
        } as Libp2pConnectedPeer)
      }

      this.logger.info(`Local: ${localPeerId} is connected to ${this.connectedPeers.size} peers`)
      this.logger.info(`Local: ${localPeerId} has ${this.libp2pInstance?.getConnections().length} open connections`)

      this.serverIoProvider.io.emit(SocketEvents.PEER_CONNECTED, {
        peer: remotePeerId,
        lastSeen: peerStats[remotePeerId].lastSeen,
        connectionDuration: 0,
      } as NetworkDataPayload)

      this.emit(Libp2pEvents.PEER_CONNECTED, {
        peers: [remotePeerId],
      })
    })

    this.libp2pInstance.addEventListener('peer:disconnect', async event => {
      const remotePeerId = event.detail.toString()
      const localPeerId = peerId.peerId.toString()
      this.logger.info(`Connection closed with ${remotePeerId}`, JSON.stringify(event))
      this.logger.info(`${localPeerId} disconnected from ${remotePeerId}`)
      if (!this.libp2pInstance) {
        this.logger.error('libp2pInstance was not created')
        throw new Error('libp2pInstance was not created')
      }
      this.logger.info(`${localPeerId} has ${this.libp2pInstance.getConnections().length} open connections`)

      const connectionStartTime = this.connectedPeers.get(remotePeerId)?.connectedAtSeconds
      if (!connectionStartTime) {
        this.logger.error(`No connection start time for peer ${remotePeerId}`)
        return
      }

      const connectionEndTime: number = DateTime.utc().toSeconds()
      const connectionDuration: number = connectionEndTime - connectionStartTime

      this.connectedPeers.delete(remotePeerId)
      this.logger.info(`${localPeerId} is connected to ${this.connectedPeers.size} peers`)
      const peerStat: NetworkDataPayload = {
        peer: remotePeerId,
        connectionDuration,
        lastSeen: connectionEndTime,
      }
      this.emit(Libp2pEvents.PEER_DISCONNECTED, peerStat)
      this.serverIoProvider.io.emit(SocketEvents.PEER_DISCONNECTED, peerStat)
      const peerPrevStats = await this.localDbService.getPeerStats(remotePeerId)
      if (!peerPrevStats) {
        this.logger.info(`No previous stats for peer ${remotePeerId}. Not updating stats`)
        return
      }
      const prev = peerPrevStats?.connectionTime || 0

      const peerStats: Record<string, NetworkStats> = {}
      peerStats[remotePeerId] = {
        ...peerPrevStats,
        connectionTime: prev + connectionDuration,
        lastSeen: connectionEndTime,
      } as NetworkStats

      await this.localDbService.updatePeerStats(peerStats)
    })

    this.logger.info(`Starting libp2p`)
    await this.libp2pInstance.start()
    this.logger.info('Queueing peers for initial dialing')
    this.ensureDialQueueInterval()

    this._connectedPeersInterval = setInterval(() => {
      const connections: Libp2pConnectedPeer[] = []
      for (const [peerId, peer] of this.connectedPeers.entries()) {
        connections.push({
          peerId,
          address: peer.address,
          connectedAtSeconds: peer.connectedAtSeconds,
        })
      }
      this.logger.info(`Current Connected Peers`, {
        connectionCount: this.connectedPeers.size,
        connections,
      })
    }, 60_000)

    this.logger.info(`Initialized libp2p for peer ${peerId.peerId.toString()}`)
  }

  public async cleanDatastore(): Promise<void> {
    await this.libp2pDatastore?.clean()
  }

  public async closeDatastore(): Promise<void> {
    await this.libp2pDatastore?.close()
    this.libp2pDatastore = null
  }

  public async close(closeDatastore = true): Promise<void> {
    this.logger.info('Closing libp2p service:', this.localAddress)
    if (this._dialQueueInterval) {
      clearInterval(this._dialQueueInterval)
      this._dialQueueInterval = null
    }
    clearInterval(this._connectedPeersInterval)

    this.redialQueue.stop(true)
    await this.hangUpPeers()
    await this.libp2pInstance?.stop()

    // gives libp2p a tick to close its services
    await new Promise<void>(r => setImmediate(r))

    if (closeDatastore) {
      await this.closeDatastore()
    }
    this.libp2pInstance = null
    this.connectedPeers = new Map()
    this.dialedPeers = new Set()
  }
}
