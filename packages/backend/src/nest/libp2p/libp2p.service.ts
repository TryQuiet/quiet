import { gossipsub } from '@chainsafe/libp2p-gossipsub'
import { noise, pureJsCrypto } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { mplex } from '@libp2p/mplex'
import { FaultTolerance } from '@libp2p/interface-transport'
import { identify, identifyPush } from '@libp2p/identify'
import { type Connection, type Libp2p } from '@libp2p/interface'
import { kadDHT } from '@libp2p/kad-dht'
import { peerIdFromString } from '@libp2p/peer-id'
import { ping } from '@libp2p/ping'
import { preSharedKey } from '@libp2p/pnet'
import * as filters from '@libp2p/websockets/filters'
import { ConnectionMonitorInit, createLibp2p } from 'libp2p'

import { isMultiaddr, multiaddr } from '@multiformats/multiaddr'
import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common'

import { EventEmitter } from 'events'
import { DateTime } from 'luxon'

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
  TorBootstrapProvider,
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
import type {
  ConnectionHealthConfig,
  ConnectionHealthDebugInfo,
  ConnectionLifecycleDebugInfo,
} from './libp2p.debug.types'

const CONNECTION_LIMIT = 20
const HEARTBEAT_ABORT_ENV = 'LIBP2P_ABORT_CONNECTION_ON_PING_FAILURE'
const CONNECTION_MONITOR_ENABLED_ENV = 'LIBP2P_CONNECTION_MONITOR_ENABLED'
const CONNECTION_MONITOR_PING_TIMEOUT_MIN_MS_ENV = 'LIBP2P_CONNECTION_MONITOR_PING_TIMEOUT_MIN_MS'
const PING_SERVICE_TIMEOUT_MS_ENV = 'LIBP2P_PING_TIMEOUT_MS'
const CONNECTION_HEALTH_CHECK_ENABLED_ENV = 'LIBP2P_CONNECTION_HEALTH_CHECK_ENABLED'
const CONNECTION_HEALTH_CHECK_INTERVAL_MS_ENV = 'LIBP2P_CONNECTION_HEALTH_CHECK_INTERVAL_MS'
const CONNECTION_HEALTH_CHECK_TIMEOUT_MS_ENV = 'LIBP2P_CONNECTION_HEALTH_CHECK_TIMEOUT_MS'
const CONNECTION_HEALTH_CHECK_FAILURE_THRESHOLD_ENV = 'LIBP2P_CONNECTION_HEALTH_CHECK_FAILURE_THRESHOLD'
const CONNECTION_HEALTH_CHECK_DEFAULT_INTERVAL_MS = 75_000
const CONNECTION_HEALTH_CHECK_DEFAULT_TIMEOUT_MS = 30_000
const CONNECTION_HEALTH_CHECK_DEFAULT_FAILURE_THRESHOLD = 3
const REDIAL_QUEUE_CONCURRENCY = 4
const REDIAL_QUEUE_BACKOFF_FACTOR = 1.6
const REDIAL_QUEUE_FUZZ_FACTOR = 0.25
const REDIAL_QUEUE_BASE_DELAY_MS = 15_000
const REDIAL_QUEUE_MAX_DELAY_MS = 180_000
const DIAL_QUEUE_INITIAL_STAGGER_MS = 1_000

const booleanEnv = (value: string | undefined, defaultValue: boolean): boolean => {
  if (value == null || value.trim() === '') return defaultValue

  switch (value.trim().toLowerCase()) {
    case 'false':
    case '0':
    case 'no':
      return false
    case 'true':
    case '1':
    case 'yes':
      return true
    default:
      return defaultValue
  }
}

const numberEnv = (value: string | undefined): number | undefined => {
  if (value == null || value.trim() === '') return undefined

  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined
}

const isPingStreamContentionError = (error: any): boolean => {
  const message = String(error?.message ?? '')
  return (
    error?.name === 'TooManyOutboundProtocolStreamsError' &&
    message.includes('Too many outbound protocol streams for protocol "/ipfs/ping/1.0.0"')
  )
}

const connectionHealthConfigFromEnv = (): ConnectionHealthConfig => ({
  enabled: booleanEnv(process.env[CONNECTION_HEALTH_CHECK_ENABLED_ENV], false),
  intervalMs:
    numberEnv(process.env[CONNECTION_HEALTH_CHECK_INTERVAL_MS_ENV]) ?? CONNECTION_HEALTH_CHECK_DEFAULT_INTERVAL_MS,
  timeoutMs:
    numberEnv(process.env[CONNECTION_HEALTH_CHECK_TIMEOUT_MS_ENV]) ?? CONNECTION_HEALTH_CHECK_DEFAULT_TIMEOUT_MS,
  failureThreshold: Math.max(
    1,
    Math.floor(
      numberEnv(process.env[CONNECTION_HEALTH_CHECK_FAILURE_THRESHOLD_ENV]) ??
        CONNECTION_HEALTH_CHECK_DEFAULT_FAILURE_THRESHOLD
    )
  ),
})

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
  private torBootstrap?: TorBootstrapProvider
  private waitingForTorBootstrapToResumeDialQueue = false
  private connectionLifecycleDebug = new Map<string, ConnectionLifecycleDebugInfo>()
  private connectionHealthDebug = new Map<string, ConnectionHealthDebugInfo>()
  private connectionHealthConfig: ConnectionHealthConfig = {
    enabled: true,
    intervalMs: CONNECTION_HEALTH_CHECK_DEFAULT_INTERVAL_MS,
    timeoutMs: CONNECTION_HEALTH_CHECK_DEFAULT_TIMEOUT_MS,
    failureThreshold: CONNECTION_HEALTH_CHECK_DEFAULT_FAILURE_THRESHOLD,
  }
  private connectionHealthChecksInFlight = new Set<string>()
  private pendingCloseTriggersByPeer = new Map<string, string>()
  private _connectionHealthInterval: NodeJS.Timeout | null = null

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
      concurrency: REDIAL_QUEUE_CONCURRENCY,
      backoffFactor: REDIAL_QUEUE_BACKOFF_FACTOR,
      fuzzFactor: REDIAL_QUEUE_FUZZ_FACTOR,
      baseDelayMs: REDIAL_QUEUE_BASE_DELAY_MS,
      maxDelayMs: REDIAL_QUEUE_MAX_DELAY_MS,
      rolloverAtMaxDelay: false,
    })
  }

  private setState(state: Libp2pState) {
    if (this.state !== state) {
      this.logger.debug(`Transitioning libp2p state: ${this.state} -> ${state}`)
    }
    this.state = state
  }

  private connectionDebugInfo(
    connection: Connection,
    existing?: ConnectionLifecycleDebugInfo
  ): ConnectionLifecycleDebugInfo {
    const connectionId = String(connection.id ?? 'unknown')
    const timelineOpen = Number((connection as any).timeline?.open)
    const openedAtMs = existing?.openedAtMs ?? (Number.isFinite(timelineOpen) ? timelineOpen : Date.now())
    const openedAtIso =
      existing?.openedAtIso ?? DateTime.fromMillis(openedAtMs).toUTC().toISO() ?? new Date(openedAtMs).toISOString()

    return {
      connectionId,
      peerId: connection.remotePeer?.toString() ?? 'unknown',
      direction: String(connection.direction ?? 'unknown'),
      remoteAddr: connection.remoteAddr?.toString() ?? 'unknown',
      status: String(connection.status ?? 'unknown'),
      openedAtMs,
      openedAtIso,
      closedAtMs: existing?.closedAtMs,
      closedAtIso: existing?.closedAtIso,
      durationMs: existing?.durationMs,
      closeTrigger: existing?.closeTrigger,
    }
  }

  private logConnectionLifecycle(
    event: string,
    info: ConnectionLifecycleDebugInfo,
    extra: Record<string, unknown> = {}
  ) {
    this.logger.debug('p2p-connection-lifecycle', JSON.stringify({ event, ...info, ...extra }))
  }

  private trackConnectionOpen(connection: Connection) {
    const info = this.connectionDebugInfo(connection)
    this.connectionLifecycleDebug.set(info.connectionId, info)
    this.connectionHealthDebug.set(info.peerId, {
      peerId: info.peerId,
      status: 'healthy',
      failureCount: 0,
      lastCheckedAtMs: Date.now(),
    })
    this.logConnectionLifecycle('connection:open', info)
  }

  private trackConnectionClose(connection: Connection) {
    const connectionId = String(connection.id ?? 'unknown')
    const existing = this.connectionLifecycleDebug.get(connectionId)
    const peerId = connection.remotePeer?.toString() ?? existing?.peerId ?? 'unknown'
    const closedAtMs = Date.now()
    const info = {
      ...this.connectionDebugInfo(connection, existing),
      closedAtMs,
      closedAtIso: DateTime.fromMillis(closedAtMs).toUTC().toISO() ?? new Date(closedAtMs).toISOString(),
      durationMs: closedAtMs - (existing?.openedAtMs ?? closedAtMs),
      closeTrigger: this.pendingCloseTriggersByPeer.get(peerId) ?? existing?.closeTrigger ?? 'libp2p-connection-close',
    }

    this.connectionLifecycleDebug.set(connectionId, info)
    this.logger.warn('p2p-connection-lifecycle', JSON.stringify({ event: 'connection:close', ...info }))
  }

  private connectionDebugInfosForPeer(peerId: string): ConnectionLifecycleDebugInfo[] {
    return [...this.connectionLifecycleDebug.values()].filter(info => info.peerId === peerId)
  }

  private clearClosedConnectionDebugForPeer(peerId: string) {
    for (const [connectionId, info] of this.connectionLifecycleDebug.entries()) {
      if (info.peerId === peerId && info.closedAtMs != null) {
        this.connectionLifecycleDebug.delete(connectionId)
      }
    }
  }

  private markPeerCloseTrigger(peerId: string, closeTrigger: string) {
    this.pendingCloseTriggersByPeer.set(peerId, closeTrigger)
  }

  private logConnectionHealth(event: string, peerId: string, extra: Record<string, unknown> = {}) {
    this.logger.debug(
      'p2p-connection-health',
      JSON.stringify({
        event,
        peerId,
        config: this.connectionHealthConfig,
        health: this.connectionHealthDebug.get(peerId) ?? null,
        ...extra,
      })
    )
  }

  private startConnectionHealthChecks() {
    if (!this.connectionHealthConfig.enabled) {
      this.logger.debug('p2p-connection-health', JSON.stringify({ event: 'health:disabled' }))
      return
    }
    if (this._connectionHealthInterval != null) return

    this.logger.debug(
      'p2p-connection-health',
      JSON.stringify({ event: 'health:start', config: this.connectionHealthConfig })
    )
    this._connectionHealthInterval = setInterval(() => {
      void this.checkConnectionHealth()
    }, this.connectionHealthConfig.intervalMs)
    this._connectionHealthInterval.unref?.()
  }

  private stopConnectionHealthChecks() {
    if (this._connectionHealthInterval != null) {
      clearInterval(this._connectionHealthInterval)
      this._connectionHealthInterval = null
    }
    this.connectionHealthChecksInFlight.clear()
  }

  private clearConnectionDebugState() {
    this.connectionLifecycleDebug.clear()
    this.connectionHealthDebug.clear()
    this.connectionHealthChecksInFlight.clear()
    this.pendingCloseTriggersByPeer.clear()
  }

  private async checkConnectionHealth() {
    if (this.state !== Libp2pState.Started || this.libp2pInstance == null) {
      return
    }

    for (const [peerId, peer] of this.connectedPeers.entries()) {
      await this.checkPeerHealth(peerId, peer.address)
    }
  }

  private async checkPeerHealth(peerId: string, peerAddress: string) {
    if (this.libp2pInstance == null) return
    if (this.connectionHealthChecksInFlight.has(peerId)) return

    const peerIdObject = peerIdFromString(peerId)
    const openConnections = this.libp2pInstance.getConnections(peerIdObject).filter(conn => conn.status === 'open')
    if (openConnections.length === 0) {
      this.logConnectionHealth('health:skip-no-open-connection', peerId, { peerAddress })
      return
    }

    this.connectionHealthChecksInFlight.add(peerId)
    const startedAtMs = Date.now()
    const previous = this.connectionHealthDebug.get(peerId)
    const pingService = this.libp2pInstance.services.ping as
      | { ping: (peer: ReturnType<typeof peerIdFromString>, options: { signal: AbortSignal }) => Promise<number> }
      | undefined

    if (pingService == null) {
      this.logConnectionHealth('health:skip-no-ping-service', peerId, { peerAddress })
      this.connectionHealthChecksInFlight.delete(peerId)
      return
    }

    try {
      this.logConnectionHealth('health:ping:start', peerId, {
        peerAddress,
        openConnectionCount: openConnections.length,
      })
      const rtt = await pingService.ping(peerIdObject, {
        signal: AbortSignal.timeout(this.connectionHealthConfig.timeoutMs),
      })
      this.connectionHealthDebug.set(peerId, {
        peerId,
        status: 'healthy',
        failureCount: 0,
        lastCheckedAtMs: Date.now(),
        lastSuccessAtMs: Date.now(),
        lastRttMs: rtt,
      })
      this.logConnectionHealth('health:ping:success', peerId, {
        peerAddress,
        rttMs: rtt,
        durationMs: Date.now() - startedAtMs,
      })
    } catch (error: any) {
      if (isPingStreamContentionError(error)) {
        this.connectionHealthDebug.set(peerId, {
          peerId,
          status: previous?.status ?? 'healthy',
          failureCount: previous?.failureCount ?? 0,
          lastCheckedAtMs: Date.now(),
          lastSuccessAtMs: previous?.lastSuccessAtMs,
          lastFailureAtMs: previous?.lastFailureAtMs,
          lastRttMs: previous?.lastRttMs,
          reconnecting: previous?.reconnecting ?? false,
        })
        this.logConnectionHealth('health:ping:contention', peerId, {
          peerAddress,
          durationMs: Date.now() - startedAtMs,
          errorName: error?.name,
          errorCode: error?.code,
          errorMessage: error?.message,
          failureCount: previous?.failureCount ?? 0,
        })
        return
      }

      const failureCount = (previous?.failureCount ?? 0) + 1
      const status = failureCount >= this.connectionHealthConfig.failureThreshold ? 'reconnecting' : 'degraded'
      this.connectionHealthDebug.set(peerId, {
        peerId,
        status,
        failureCount,
        lastCheckedAtMs: Date.now(),
        lastSuccessAtMs: previous?.lastSuccessAtMs,
        lastFailureAtMs: Date.now(),
        lastRttMs: previous?.lastRttMs,
        lastErrorName: error?.name,
        lastErrorCode: error?.code,
        lastErrorMessage: error?.message,
        reconnecting: status === 'reconnecting',
      })
      this.logConnectionHealth('health:ping:failure', peerId, {
        peerAddress,
        durationMs: Date.now() - startedAtMs,
        errorName: error?.name,
        errorCode: error?.code,
        errorMessage: error?.message,
        failureCount,
      })

      if (failureCount >= this.connectionHealthConfig.failureThreshold) {
        this.markPeerCloseTrigger(peerId, 'health-check-threshold')
        this.logConnectionHealth('health:redial', peerId, {
          peerAddress,
          failureThreshold: this.connectionHealthConfig.failureThreshold,
        })
        await this.hangUpPeer(peerAddress, true)
      }
    } finally {
      this.connectionHealthChecksInFlight.delete(peerId)
    }
  }

  public onModuleDestroy() {
    this.logger.log('Module is being destroyed')
    this.redialQueue.stop(true)
    this.stopConnectionHealthChecks()
    this.clearConnectionDebugState()
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
        this.logger.debug('Error while deciding to redial', e)
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

    this.logger.debug(`Dialing peer address: ${peerAddress}`)
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
        if (
          !e.message.includes('Unexpected server response: 404') &&
          !e.message.includes('Unexpected server response: 503')
        ) {
          this.logger.debug(`Failed to dial peer address: ${peerAddress}`, e.message, e.code)
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

    let queuedFirstAttempts = 0
    for (const addr of dialable) {
      if (this.redialQueue.hasTask(addr)) continue
      const delayMs = this.dialedPeers.has(addr) ? undefined : queuedFirstAttempts * DIAL_QUEUE_INITIAL_STAGGER_MS
      if (!this.dialedPeers.has(addr)) {
        queuedFirstAttempts += 1
      }
      await this.redialQueue.enqueue({
        key: addr,
        delayMs,
        task: async () => this.dialPeer(addr, { throwOnError: true, redialOnError: false }),
      })
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

    let queuedFirstAttempts = 0
    for (const addr of sortedPeers) {
      const peerId = addr.split('/').pop()
      if (peerId === undefined) continue
      if (addr === this.localAddress) continue
      if (this.redialQueue.hasTask(addr)) continue
      if (this.connectedPeers.has(peerId)) continue
      const delayMs = this.dialedPeers.has(addr) ? undefined : queuedFirstAttempts * DIAL_QUEUE_INITIAL_STAGGER_MS
      if (!this.dialedPeers.has(addr)) {
        queuedFirstAttempts += 1
      }

      await this.redialQueue.enqueue({
        key: addr,
        delayMs,
        task: async () => this.dialPeer(addr, { throwOnError: true, redialOnError: false }),
      })
    }
  }

  private replenishDialQueue = async () => {
    try {
      await this.addPeersToDialQueue()
    } catch (err) {
      this.logger.warn('Error replenishing dial queue', err)
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
      void this.replenishDialQueue()
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
    void this.replenishDialQueue()
  }

  private async resumeDialQueueWhenTorReady(onReady?: () => Promise<void>): Promise<boolean> {
    const resumeDialing = async () => {
      if (onReady) {
        await onReady()
      }
      this.resumeDialQueue()
    }

    if (this.torBootstrap == null || this.torBootstrap.bootstrapped) {
      await resumeDialing()
      return true
    }

    if (this.waitingForTorBootstrapToResumeDialQueue) {
      this.logger.debug('Already waiting for Tor to bootstrap before resuming dial queue')
      return false
    }

    this.waitingForTorBootstrapToResumeDialQueue = true
    this.logger.debug('Waiting for Tor to bootstrap before resuming dial queue')
    this.torBootstrap.once('bootstrapped', () => {
      this.waitingForTorBootstrapToResumeDialQueue = false
      if ([Libp2pState.Paused, Libp2pState.Stopping, Libp2pState.Stopped].includes(this.state)) {
        this.logger.debug('Tor bootstrapped but libp2p is not active, leaving dial queue paused')
        return
      }

      void resumeDialing()
        .then(() => {
          if (this.state === Libp2pState.Starting) {
            this.setState(Libp2pState.Started)
          }
        })
        .catch(err => {
          this.logger.warn('Failed to resume dial queue after Tor bootstrapped', err)
        })
    })

    return false
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
    const resumed = await this.resumeDialQueueWhenTorReady(async () => {
      if (peersToDial && peersToDial.length > 0) {
        this.logger.debug(`Redialing ${peersToDial.length} peers`)
        await this.redialPeers(peersToDial)
      }
    })
    if (resumed) {
      this.setState(Libp2pState.Started)
    }
    return true
  }

  public readonly createLibp2pAddress = (address: string, peerId: string): string => {
    return createLibp2pAddress(address, peerId)
  }

  public readonly createLibp2pListenAddress = (address: string): string => {
    return createLibp2pListenAddress(address)
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
      this.markPeerCloseTrigger(peerId.toString(), redial ? 'local-hangup-redial' : 'local-hangup')

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
      this.logger.debug('Error while hanging up on peer', e)
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
    const sortedPeers = peersToDial == null ? await this.localDbService.getSortedPeers(false) : []
    const toDial = new Set(peersToDial ?? [...sortedPeers, ...this.dialedPeers])
    toDial.delete(this.localAddress)
    const targets = [...toDial]

    if (targets.length === 0) {
      this.logger.debug('No peers to redial!')
      return
    }

    this.logger.debug(`Re-dialing ${targets.length} peers`)

    const peersToHangUp = new Set<string>()
    for (const peerAddress of targets) {
      const peerId = peerAddress.split('/').pop()
      const connectedAddress = peerId ? this.connectedPeers.get(peerId)?.address : undefined
      peersToHangUp.add(connectedAddress ?? peerAddress)
    }

    await this.hangUpPeers([...peersToHangUp])

    await this.dialPeers(targets)
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
    this.torBootstrap = params.torBootstrap

    let libp2p: Libp2p

    const connectionMonitorPingTimeoutMinMs = numberEnv(process.env[CONNECTION_MONITOR_PING_TIMEOUT_MIN_MS_ENV])
    const pingServiceTimeoutMs = numberEnv(process.env[PING_SERVICE_TIMEOUT_MS_ENV])
    this.connectionHealthConfig = connectionHealthConfigFromEnv()
    const connectionMonitorEnabled = booleanEnv(
      process.env[CONNECTION_MONITOR_ENABLED_ENV],
      !this.connectionHealthConfig.enabled
    )
    const connectionMonitorConfig = {
      abortConnectionOnPingFailure: booleanEnv(process.env[HEARTBEAT_ABORT_ENV], false),
      pingInterval: 60_000,
      enabled: connectionMonitorEnabled,
      ...(connectionMonitorPingTimeoutMinMs == null
        ? {}
        : {
            pingTimeout: {
              minTimeout: connectionMonitorPingTimeoutMinMs,
            },
          }),
    } satisfies ConnectionMonitorInit

    this.logger.debug(
      'p2p-heartbeat-monitor-config',
      JSON.stringify({
        ...connectionMonitorConfig,
        enabledEnv: CONNECTION_MONITOR_ENABLED_ENV,
        enabledEnvValue: process.env[CONNECTION_MONITOR_ENABLED_ENV] ?? null,
        env: HEARTBEAT_ABORT_ENV,
        envValue: process.env[HEARTBEAT_ABORT_ENV] ?? null,
        pingTimeoutMinEnv: CONNECTION_MONITOR_PING_TIMEOUT_MIN_MS_ENV,
        pingTimeoutMinEnvValue: process.env[CONNECTION_MONITOR_PING_TIMEOUT_MIN_MS_ENV] ?? null,
      })
    )
    this.logger.debug(
      'p2p-ping-service-config',
      JSON.stringify({
        timeout: pingServiceTimeoutMs ?? null,
        env: PING_SERVICE_TIMEOUT_MS_ENV,
        envValue: process.env[PING_SERVICE_TIMEOUT_MS_ENV] ?? null,
      })
    )
    this.logger.debug(
      'p2p-connection-health',
      JSON.stringify({
        event: 'health:config',
        config: this.connectionHealthConfig,
        env: {
          enabled: CONNECTION_HEALTH_CHECK_ENABLED_ENV,
          enabledValue: process.env[CONNECTION_HEALTH_CHECK_ENABLED_ENV] ?? null,
          intervalMs: CONNECTION_HEALTH_CHECK_INTERVAL_MS_ENV,
          intervalMsValue: process.env[CONNECTION_HEALTH_CHECK_INTERVAL_MS_ENV] ?? null,
          timeoutMs: CONNECTION_HEALTH_CHECK_TIMEOUT_MS_ENV,
          timeoutMsValue: process.env[CONNECTION_HEALTH_CHECK_TIMEOUT_MS_ENV] ?? null,
          failureThreshold: CONNECTION_HEALTH_CHECK_FAILURE_THRESHOLD_ENV,
          failureThresholdValue: process.env[CONNECTION_HEALTH_CHECK_FAILURE_THRESHOLD_ENV] ?? null,
        },
      })
    )

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
        connectionMonitor: connectionMonitorConfig,
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
          ping: ping(pingServiceTimeoutMs == null ? {} : { timeout: pingServiceTimeoutMs }),
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
      this.logger.debug('libp2pInstance was not created')
      throw new Error('libp2pInstance was not created')
    }

    this.logger.info(`Local peerId: ${peerId.peerId.toString()}`)
    this.logger.debug(`Setting up libp2p event listeners`)

    this.serverIoProvider.io.emit(SocketEvents.CONNECTION_PROCESS_INFO, ConnectionProcessInfo.INITIALIZING_LIBP2P)

    this.libp2pInstance.addEventListener('connection:open', openEvent => {
      this.trackConnectionOpen(openEvent.detail)
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
      this.trackConnectionClose(event.detail)
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
            this.logger.debug('Failed to hang up paused connection', error)
          }
        }
        return
      }
      const localPeerId = peerId.peerId.toString()
      this.logger.debug(
        'p2p-peer-lifecycle',
        JSON.stringify({
          event: 'peer:connect',
          peerId: remotePeerId,
          localPeerId,
          connectionCount: connection?.length ?? 0,
          connections: connection?.map(conn =>
            this.connectionDebugInfo(conn, this.connectionLifecycleDebug.get(String(conn.id ?? 'unknown')))
          ),
        })
      )
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
      }
      await this.localDbService.updatePeerStats(peerStats)

      if (connection) {
        // Ensure address is always a string
        const address = peerStats[remotePeerId].address || remoteAddr || ''
        const connectedPeer: Libp2pConnectedPeer = {
          peerId: remotePeerId,
          address,
          connectedAtSeconds: DateTime.utc().toSeconds(),
        }
        this.connectedPeers.set(remotePeerId, connectedPeer)
      }

      this.logger.debug(`Local: ${localPeerId} is connected to ${this.connectedPeers.size} peers`)
      this.logger.debug(`Local: ${localPeerId} has ${this.libp2pInstance?.getConnections().length} open connections`)

      const networkDataPayload: NetworkDataPayload = {
        peer: remotePeerId,
        address: peerStats[remotePeerId].address,
        lastSeen: peerStats[remotePeerId].lastSeen,
        connectionDuration: 0,
      }
      this.serverIoProvider.io.emit(SocketEvents.PEER_CONNECTED, networkDataPayload)

      this.emit(Libp2pEvents.PEER_CONNECTED, {
        peers: [remotePeerId],
      })
    })

    this.libp2pInstance.addEventListener('peer:disconnect', async event => {
      const remotePeerId = event.detail.toString()
      const localPeerId = peerId.peerId.toString()
      const connectionDebugInfos = this.connectionDebugInfosForPeer(remotePeerId)
      this.logger.debug(
        'p2p-peer-lifecycle',
        JSON.stringify({
          event: 'peer:disconnect',
          peerId: remotePeerId,
          localPeerId,
          closeTrigger: this.pendingCloseTriggersByPeer.get(remotePeerId) ?? 'peer-disconnect-after-connection-close',
          connections: connectionDebugInfos,
        })
      )
      this.logger.debug(`Connection closed with ${remotePeerId}`, JSON.stringify(event))
      this.logger.debug(`${localPeerId} disconnected from ${remotePeerId}`)
      if (!this.libp2pInstance) {
        this.logger.debug('libp2pInstance was not created')
        throw new Error('libp2pInstance was not created')
      }
      this.logger.debug(`${localPeerId} has ${this.libp2pInstance.getConnections().length} open connections`)

      let connectionStartTime = this.connectedPeers.get(remotePeerId)?.connectedAtSeconds
      const connectionEndTime: number = DateTime.utc().toSeconds()
      if (connectionStartTime == null) {
        this.logger.debug(`No connection start time for peer ${remotePeerId}`)
        connectionStartTime = connectionEndTime
      }
      const connectionDuration: number = connectionEndTime - connectionStartTime

      this.connectedPeers.delete(remotePeerId)
      this.pendingCloseTriggersByPeer.delete(remotePeerId)
      this.connectionHealthDebug.delete(remotePeerId)
      this.connectionHealthChecksInFlight.delete(remotePeerId)
      this.clearClosedConnectionDebugForPeer(remotePeerId)
      this.logger.debug(`${localPeerId} is now connected to ${this.connectedPeers.size} peers`)
      const peerPrevStats = await this.localDbService.getPeerStats(remotePeerId)

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

      const address = peerPrevStats.address
      await this.localDbService.updatePeerStats(peerStats)
      const peerStat: NetworkDataPayload = {
        peer: remotePeerId,
        address,
        connectionDuration,
        lastSeen: connectionEndTime,
      }
      this.emit(Libp2pEvents.PEER_DISCONNECTED, peerStat)
      this.serverIoProvider.io.emit(SocketEvents.PEER_DISCONNECTED, peerStat)
    })

    this.logger.debug(`Starting libp2p`)
    this.setState(Libp2pState.Starting)
    await this.libp2pInstance.start()
    this.setState(Libp2pState.Started)
    this.startConnectionHealthChecks()
    this.logger.debug('Queueing peers for initial dialing')
    await this.resumeDialQueueWhenTorReady()

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
    this.stopConnectionHealthChecks()
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
    this.clearConnectionDebugState()
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
