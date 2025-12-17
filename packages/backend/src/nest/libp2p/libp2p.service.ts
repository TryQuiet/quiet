import { gossipsub } from '@chainsafe/libp2p-gossipsub'
import { noise, pureJsCrypto } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { mplex } from '@libp2p/mplex'
import { FaultTolerance } from '@libp2p/interface-transport'
import { identify, identifyPush } from '@libp2p/identify'
import { type Libp2p } from '@libp2p/interface'
import { kadDHT } from '@libp2p/kad-dht'
import { peerIdFromString } from '@libp2p/peer-id'
import { ping } from '@libp2p/ping'
import { preSharedKey } from '@libp2p/pnet'
import * as filters from '@libp2p/websockets/filters'
import { ConnectionMonitorInit, createLibp2p } from 'libp2p'

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

export enum Libp2pState {
  Started = 'started',
  Stopped = 'stopped',
  Starting = 'starting',
  Stopping = 'stopping',
  Paused = 'paused',
}

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
  public state: Libp2pState = Libp2pState.Stopped

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
    this.serverIoProvider.io.engine.on('connection_error', err => {
      this.logger.error(
        'Server IO experienced a connection error with frontend',
        err.message,
        err.code,
        err.context,
        err
      )
      this.serverIoProvider.io.on('connection', socket => {
        this.logger.warn('Redialing all known peers due to a server IO reconnect')
      })
    })
  }

  private setState(state: Libp2pState) {
    if (this.state !== state) {
      this.logger.debug(`Transitioning libp2p state: ${this.state} -> ${state}`)
    }
    this.state = state
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

    this.setState(Libp2pState.Stopping)
  }

  public emit(event: string | symbol, ...args: any[]): boolean {
    this.logger.debug(`Emitting event: ${event.toString()}`, args)
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
  public redialPeerAfterDelay = async (peerAddress: string, delayMs?: number): Promise<void> => {
    await this.redialQueue.enqueue({
      key: peerAddress,
      task: async (): Promise<void> => {
        await this.dialPeer(peerAddress, { throwOnError: true, redialOnError: false })
      },
      delayMs,
    })
  }

  public dialPeer = async (
    peerAddress: string,
    options: DialPeerOptions = { throwOnError: false, redialOnError: true }
  ) => {
    const peerId = peerAddress.split('/').pop()!
    if (this.connectedPeers.has(peerId)) {
      this.logger.trace(`Already connected to peer address: ${peerAddress}`)
      return
    }

    if (this.libp2pInstance == null) {
      this.logger.warn('Libp2p not initialized, dialing after delay', peerAddress)
      await this.redialPeerAfterDelay(peerAddress, 4_000)
      return
    }

    this.logger.trace(`Dialing peer address: ${peerAddress}`)
    if (!peerAddress.includes(this.libp2pInstance.peerId.toString())) {
      try {
        this.dialedPeers.add(peerAddress)
        const parsedMultiAddr = multiaddr(peerAddress)
        if (!isMultiaddr(parsedMultiAddr)) {
          this.logger.error(`Invalid multiaddr: ${peerAddress}`)
          return
        }
        await this.libp2pInstance?.dial(parsedMultiAddr)
      } catch (e) {
        if (!e.message.includes('Unexpected server response: 404')) {
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
    this.logger.debug('Dialing peer addresses', dialable)
    this.logger.debug('Local Address', this.localAddress)
    this.logger.debug(peerAddresses.length, dialable.length)

    for (const addr of dialable) {
      this.dialPeer(addr)
    }
  }

  public addPeersToDialQueue = async () => {
    let sortedPeers: string[]
    try {
      sortedPeers = await this.localDbService.getSortedPeers(false)
    } catch {
      this.logger.debug('No peers to dial')
      return
    }

    for (const addr of sortedPeers) {
      const peerId = addr.split('/').pop()!
      if (addr === this.localAddress) continue
      if (this.redialQueue.hasTask(addr)) continue
      if (this.connectedPeers.has(peerId)) continue
      const delayMs = this.dialedPeers.has(addr) ? undefined : 0 // dial immediately if this is our first attempt at dialing this address

      await this.redialQueue.enqueue({
        key: addr,
        delayMs,
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

  public pause = async (): Promise<boolean> => {
    this.logger.debug('Pausing libp2p')
    if (this.libp2pInstance == null) {
      this.logger.warn('Libp2p not initialized, cannot pause')
      return false
    }
    this.setState(Libp2pState.Paused)
    this.pauseDialQueue()
    const peerInfo = this.getCurrentPeerInfo()
    await this.hangUpPeers()
    this.dialedPeers.clear()
    this.connectedPeers.clear()
    // await this.libp2pDatastore?.deleteKeysByPrefix(Libp2pDatastorePrefix.PEERS)
    return true
  }

  public resume = async (peersToDial?: string[]): Promise<boolean> => {
    this.logger.debug('Resuming libp2p')
    if (this.libp2pInstance == null) {
      this.logger.warn('Libp2p not initialized, cannot resume')
      return false
    }
    this.setState(Libp2pState.Starting)
    // await this.libp2pInstance?.start()
    if (peersToDial && peersToDial.length > 0) {
      this.logger.debug(`Redialing ${peersToDial.length} peers`)
      await this.redialPeers(peersToDial)
    }
    this.resumeDialQueue()
    this.setState(Libp2pState.Started)
    return true
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
    this.logger.debug('Hanging up on all peers')
    for (const peer of peersToHangUp) {
      await this.hangUpPeer(peer)
    }
    this.logger.debug('All peers hung up')
  }

  public async hangUpPeer(peerAddress: string, redial = false) {
    this.logger.debug('Hanging up on peer', peerAddress)
    const controller = new AbortController()
    try {
      const ma = multiaddr(peerAddress)
      const peerId = peerIdFromString(ma.getPeerId()!)

      this.logger.debug('Disconnecting auth service gracefully')
      this.authService?.closeAuthConnection(peerId)

      this.logger.debug('Hanging up connection on libp2p')
      await this.libp2pInstance?.hangUp(ma, { signal: controller.signal })

      this.logger.debug('Removing peer from peer store')
      await this.libp2pInstance?.peerStore.delete(peerId as any)

      this.logger.debug('Clearing local data')
      this.dialedPeers.delete(peerAddress)
      this.logger.debug('Done hanging up')
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
      this.logger.debug('No peers to redial!')
      return
    }

    this.logger.debug(`Re-dialing ${dialed.length} peers`)

    // TODO: Sort peers
    await this.hangUpPeers(dialed)

    await this.dialPeers(toDial)
  }

  public async createInstance(params: Libp2pNodeParams): Promise<Libp2p> {
    if (params.instanceName != null) {
      this.logger = this.logger.extend(params.instanceName)
    }
    this.logger.debug(`Creating new libp2p instance`)

    if (this.libp2pInstance) {
      this.logger.warn(`Found an existing instance of libp2p, returning...`)
      return this.libp2pInstance
    }

    this.logger.debug(`Creating or opening existing level datastore for libp2p`)
    this.libp2pDatastore = new Libp2pDatastore({
      inMemory: false,
      datastorePath: this.datastorePath,
    })

    this.localAddress = params.localAddress

    let libp2p: Libp2p

    this.logger.debug(`Creating libp2p`)
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
          protocolNegotiationTimeout: 30_000,
          maxDialQueueLength: 500,
          reconnectRetries: 0,
        },
        privateKey: params.peerId.privKey,
        addresses: { listen: params.listenAddresses },
        connectionMonitor: {
          abortConnectionOnPingFailure: true,
          pingInterval: 20_000,
          enabled: true,
        } satisfies ConnectionMonitorInit,
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
                  handshakeTimeout: 90_000,
                  ciphers: WEBSOCKET_CIPHER_SUITE,
                  followRedirects: true,
                },
                localAddress: params.localAddress,
                targetPort: params.targetPort,
                inboundConnectionUpgradeTimeout: 60_000,
                closeOnEnd: false,
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
    this.logger.debug(`Performing post-creation setup of libp2p instance`)

    if (!this.libp2pInstance) {
      this.logger.error('libp2pInstance was not created')
      throw new Error('libp2pInstance was not created')
    }

    this.logger.info(`Local peerId: ${peerId.peerId.toString()}`)
    this.logger.debug(`Setting up libp2p event listeners`)

    this.serverIoProvider.io.emit(SocketEvents.CONNECTION_PROCESS_INFO, ConnectionProcessInfo.INITIALIZING_LIBP2P)

    this.libp2pInstance.addEventListener('connection:open', openEvent => {
      this.logger.debug(
        `Opened connection with ID ${openEvent.detail.id} with peer`,
        openEvent.detail.remotePeer.toString()
      )
    })

    this.libp2pInstance.addEventListener('peer:identify', async event => {
      const identifyResult = event.detail
      this.logger.debug(`Identified peer`, identifyResult.peerId.toString())
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
      this.logger.debug(`${peerId.peerId.toString()} discovered ${peer.detail.id}`)
    })

    this.libp2pInstance.addEventListener('connection:close', event => {
      this.logger.warn(`Connection with ID ${event.detail.id} closing with peer`, event.detail.remotePeer.toString())
    })

    this.libp2pInstance.addEventListener('transport:close', event => {
      this.logger.debug(`Transport closing`)
    })

    this.libp2pInstance.addEventListener('peer:connect', async event => {
      const remotePeerId = event.detail.toString()
      const connection = this.libp2pInstance?.getConnections(event.detail)
      const remoteAddr = connection?.[0]?.remoteAddr?.toString()
      if (this.state === Libp2pState.Paused) {
        this.logger.warn(`Received connection from ${remotePeerId} while paused, hanging up`)
        if (remoteAddr) {
          await this.hangUpPeer(remoteAddr)
        } else if (this.libp2pInstance) {
          try {
            await this.libp2pInstance.hangUp(event.detail)
          } catch (error) {
            this.logger.error('Failed to hang up paused connection', error)
          }
        }
        return
      }
      const localPeerId = peerId.peerId.toString()
      this.logger.debug(`Connection established with ${remotePeerId}`, JSON.stringify(connection))
      this.logger.debug(`${localPeerId} connected to ${remotePeerId}`)

      // update peer stats
      const peerPrevStats = await this.localDbService.getPeerStats(remotePeerId)
      const peerStats: Record<string, NetworkStats> = {}
      peerStats[remotePeerId] = {
        ...(peerPrevStats ?? {}),
        peerId: remotePeerId,
        connectionTime: peerPrevStats?.connectionTime ?? 0,
        lastSeen: DateTime.utc().valueOf(),
      } as NetworkStats
      await this.localDbService.updatePeerStats(peerStats)

      if (connection) {
        this.connectedPeers.set(remotePeerId, {
          peerId: remotePeerId,
          address: peerStats[remotePeerId].address || remoteAddr,
          connectedAtSeconds: DateTime.utc().toSeconds(),
        } as Libp2pConnectedPeer)
      }

      this.logger.debug(`Local: ${localPeerId} is connected to ${this.connectedPeers.size} peers`)
      this.logger.debug(`Local: ${localPeerId} has ${this.libp2pInstance?.getConnections().length} open connections`)

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
      this.logger.debug(`Connection closed with ${remotePeerId}`, JSON.stringify(event))
      this.logger.debug(`${localPeerId} disconnected from ${remotePeerId}`)
      if (!this.libp2pInstance) {
        this.logger.error('libp2pInstance was not created')
        throw new Error('libp2pInstance was not created')
      }
      this.logger.debug(`${localPeerId} has ${this.libp2pInstance.getConnections().length} open connections`)

      let connectionStartTime = this.connectedPeers.get(remotePeerId)?.connectedAtSeconds
      const connectionEndTime: number = DateTime.utc().toSeconds()
      if (connectionStartTime == null) {
        this.logger.error(`No connection start time for peer ${remotePeerId}`)
        connectionStartTime = connectionEndTime
      }
      const connectionDuration: number = connectionEndTime - connectionStartTime

      this.connectedPeers.delete(remotePeerId)
      this.logger.debug(`${localPeerId} is now connected to ${this.connectedPeers.size} peers`)
      const peerStat: NetworkDataPayload = {
        peer: remotePeerId,
        connectionDuration,
        lastSeen: connectionEndTime,
      }
      this.emit(Libp2pEvents.PEER_DISCONNECTED, peerStat)
      this.serverIoProvider.io.emit(SocketEvents.PEER_DISCONNECTED, peerStat)
      const peerPrevStats = await this.localDbService.getPeerStats(remotePeerId)
      const address = peerPrevStats?.address
      if (address != null) {
        this.logger.trace('Redialing disconnected peer after delay', address)
        await this.redialPeerAfterDelay(address, 20_000)
      } else {
        this.logger.warn('No address found for this peer ID, skipping redial', remotePeerId)
      }

      if (peerPrevStats == null) {
        this.logger.debug(`No previous stats for peer ${remotePeerId}. Not updating stats`)
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

    this.logger.debug(`Starting libp2p`)
    this.setState(Libp2pState.Starting)
    await this.libp2pInstance.start()
    this.setState(Libp2pState.Started)
    this.logger.debug('Queueing peers for initial dialing')
    this.ensureDialQueueInterval()

    this._connectedPeersInterval = setInterval(async () => {
      const connections: Libp2pConnectedPeer[] = []
      for (const [peerId, peer] of this.connectedPeers.entries()) {
        connections.push({
          peerId,
          address: peer.address,
          connectedAtSeconds: peer.connectedAtSeconds,
        })
      }
      this.logger.debug(`Current Connected Peers`, {
        connectionCount: this.connectedPeers.size,
        connections,
      })
      const peerStats = await this.localDbService.getPeerStats()
      this.logger.debug(`Current Peer Stats:`, peerStats)
    }, 60_000)

    this.logger.debug(`Initialized libp2p for peer ${peerId.peerId.toString()}`)
  }

  public async cleanDatastore(): Promise<void> {
    await this.libp2pDatastore?.clean()
  }

  public async closeDatastore(): Promise<void> {
    await this.libp2pDatastore?.close()
    this.libp2pDatastore = null
  }

  public async close(closeDatastore = true): Promise<void> {
    this.logger.debug('Closing libp2p service:', this.localAddress)
    this.setState(Libp2pState.Stopping)
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
    this.setState(Libp2pState.Stopped)
  }

  public async toggleP2P(enabled: boolean): Promise<boolean> {
    this.logger.debug(`Toggling P2P to ${enabled}`)
    if (enabled) {
      this.resume()
    } else {
      await this.pause()
    }
    return enabled
  }
}
