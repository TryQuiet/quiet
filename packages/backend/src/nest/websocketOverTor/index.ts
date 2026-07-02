// Forked from:
// https://github.com/libp2p/js-libp2p/blob/863949482bfa83ac3be2b72a4036ed9315f52d11/packages/transport-websockets/src/index.ts
//
// Essentially, the only thing we've done is override the listening port of the
// listener and add a remoteAddress query parameter in the _connect function.

import {
  ConnectionFailedError,
  transportSymbol,
  serviceCapabilities,
  TypedEventTarget,
  Libp2pEvents,
} from '@libp2p/interface'
import { multiaddrToUri as toUri } from '@multiformats/multiaddr-to-uri'
import { connect, type WebSocketOptions } from 'it-ws/client'
import pDefer from 'p-defer'
import { CustomProgressEvent } from 'progress-events'
import { raceSignal } from 'race-signal'
import * as filters from './filters'
import { createListener } from './listener'
import { socketToMaConn } from './socket-to-conn'
import type {
  Transport,
  MultiaddrFilter,
  CreateListenerOptions,
  DialTransportOptions,
  Listener,
  AbortOptions,
  ComponentLogger,
  Logger,
  Connection,
  MultiaddrConnection,
  OutboundConnectionUpgradeEvents,
  Metrics,
  CounterGroup,
} from '@libp2p/interface'
import type { Multiaddr } from '@multiformats/multiaddr'
import type { Server } from 'http'
import type { DuplexWebSocket } from 'it-ws/duplex'
import type { ProgressEvent } from 'progress-events'
import type { ClientOptions, CloseEvent } from 'ws'
import http from 'node:http'
import https from 'node:https'
import { QuietLibp2pLogger } from '../libp2p/libp2p.logger'

export interface WebSocketsInit extends AbortOptions, WebSocketOptions {
  /**
   * @deprecated Use a ConnectionGater instead
   */
  filter?: MultiaddrFilter

  /**
   * Options used to create WebSockets
   */
  websocket?: ClientOptions

  /**
   * Options used to create the HTTP server
   */
  http?: http.ServerOptions

  /**
   * Options used to create the HTTPs server. `options.http` will be used if
   * unspecified.
   */
  https?: https.ServerOptions

  /**
   * Inbound connections must complete their upgrade within this many ms
   *
   * @default 5000
   */
  inboundConnectionUpgradeTimeout?: number

  localAddress: string
  targetPort: number
}

export interface WebSocketsComponents {
  logger: ComponentLogger
  events: TypedEventTarget<Libp2pEvents>
  metrics?: Metrics
}

export interface WebSocketsMetrics {
  dialerEvents: CounterGroup
}

export type WebSocketsDialEvents = OutboundConnectionUpgradeEvents | ProgressEvent<'websockets:open-connection'>

const EXPECTED_SERVER_RESPONSES = new Set(['Unexpected server response: 404', 'Unexpected server response: 503'])
const CONNECT_PHASE_RETRYABLE_SERVER_RESPONSES = new Set(['Unexpected server response: 503'])

export class RetryableWebSocketConnectError extends ConnectionFailedError {
  public readonly code = 'ERR_RETRYABLE_WEBSOCKET_CONNECT'
  public readonly retryable = true
  public readonly phase = 'connect'
  public readonly cause: unknown

  constructor(message: string, cause: unknown) {
    super(message)
    this.name = 'RetryableWebSocketConnectError'
    this.cause = cause
  }
}

export class RetryableWebSocketUpgradeError extends ConnectionFailedError {
  public readonly code = 'ERR_RETRYABLE_WEBSOCKET_UPGRADE'
  public readonly retryable = true
  public readonly phase: string
  public readonly cause: unknown

  constructor(message: string, phase: string, cause: unknown) {
    super(message)
    this.name = 'RetryableWebSocketUpgradeError'
    this.phase = phase
    this.cause = cause
  }
}

const isRetryableUpgradeFailure = (err: any): boolean => {
  const message = String(err?.message ?? '').toLowerCase()
  return (
    err?.code === 'ERR_UNEXPECTED_EOF' ||
    err?.code === 'ABORT_ERR' ||
    ['UnexpectedEOFError', 'AbortError', 'TimeoutError'].includes(err?.name) ||
    message.includes('unexpected end of input') ||
    message.includes('read aborted') ||
    message.includes('websocket was closed before the connection was established')
  )
}

export class WebSockets implements Transport<WebSocketsDialEvents> {
  private readonly init: WebSocketsInit
  private readonly logger: ComponentLogger
  private readonly metrics?: WebSocketsMetrics
  private readonly components: WebSocketsComponents

  constructor(components: WebSocketsComponents, init: WebSocketsInit) {
    this.logger = components.logger
    this.components = components
    this.init = init

    if (components.metrics != null) {
      this.metrics = {
        dialerEvents: components.metrics.registerCounterGroup('libp2p_websockets_dialer_events_total', {
          label: 'event',
          help: 'Total count of WebSockets dialer events by type',
        }),
      }
    }
  }

  readonly [transportSymbol] = true

  readonly [Symbol.toStringTag] = '@quiet/websockets'

  readonly [serviceCapabilities]: string[] = ['@libp2p/transport']

  async dial(ma: Multiaddr, options?: DialTransportOptions<WebSocketsDialEvents>): Promise<Connection> {
    const _log = this.components.logger.forComponent(`libp2p:websockets:dial:${ma.getPeerId()}`) as QuietLibp2pLogger
    _log('dialing %s', ma)
    options = options ?? ({} as DialTransportOptions<WebSocketsDialEvents>)
    const peerId = ma.getPeerId() ?? 'unknown'
    const dialStartedAtMs = Date.now()
    const dialId = `${peerId}:${dialStartedAtMs}`
    let phase: 'connect' | 'upgrade' = 'connect'
    let socket: DuplexWebSocket | undefined
    let maConn: MultiaddrConnection | undefined

    _log(
      'p2p-websocket-dial %s',
      JSON.stringify({
        event: 'dial:start',
        dialId,
        peerId,
        remoteAddr: ma.toString(),
        startedAtMs: dialStartedAtMs,
      })
    )

    try {
      socket = await this._connect(ma, options)
      _log(
        'p2p-websocket-dial %s',
        JSON.stringify({ event: 'dial:websocket-connected', dialId, peerId, ageMs: Date.now() - dialStartedAtMs })
      )
      maConn = socketToMaConn(socket, ma, {
        logger: this.logger,
        metrics: this.metrics?.dialerEvents,
        signal: options.signal,
      })
      _log('new outbound connection %s', maConn.remoteAddr)
      phase = 'upgrade'
      _log(
        'p2p-websocket-dial %s',
        JSON.stringify({ event: 'dial:upgrade:start', dialId, peerId, remoteAddr: maConn.remoteAddr.toString() })
      )

      const conn = await options.upgrader.upgradeOutbound(maConn, options)
      _log('outbound connection %s upgraded', maConn.remoteAddr)
      _log(
        'p2p-websocket-dial %s',
        JSON.stringify({
          event: 'dial:upgrade:complete',
          dialId,
          peerId,
          connectionId: conn.id,
          direction: conn.direction,
          status: conn.status,
          ageMs: Date.now() - dialStartedAtMs,
        })
      )

      return conn
    } catch (err: any) {
      const retryable = err?.retryable === true || (phase === 'upgrade' && isRetryableUpgradeFailure(err))
      const errorToThrow = retryable
        ? err?.retryable === true
          ? err
          : new RetryableWebSocketUpgradeError(
              `Retryable Tor WebSocket upgrade failure for ${ma.toString()}: ${err?.message ?? err}`,
              phase,
              err
            )
        : err
      const logDialFailure = retryable ? _log.warn.bind(_log) : _log.error.bind(_log)
      logDialFailure(
        'p2p-websocket-dial %s',
        JSON.stringify({
          event: 'dial:failed',
          dialId,
          peerId,
          phase,
          retryable,
          ageMs: Date.now() - dialStartedAtMs,
          errorName: errorToThrow?.name,
          errorCode: errorToThrow?.code,
          errorMessage: errorToThrow?.message,
          causeName: err?.name,
          causeCode: err?.code,
          causeMessage: err?.message,
        })
      )
      if (phase === 'upgrade' && maConn != null) {
        maConn.abort(errorToThrow instanceof Error ? errorToThrow : new Error(String(errorToThrow)))
      } else if (socket != null) {
        socket.close().catch(closeErr => {
          _log.error('error closing raw socket after dial failure', closeErr)
        })
      }
      throw errorToThrow
    }
  }

  async _connect(ma: Multiaddr, options: DialTransportOptions<WebSocketsDialEvents>): Promise<DuplexWebSocket> {
    options?.signal?.throwIfAborted()

    const _log = this.components.logger.forComponent(
      `libp2p:websockets:dial:connect:${ma.getPeerId()}`
    ) as QuietLibp2pLogger

    const cOpts = ma.toOptions()
    _log('dialing %s:%s', cOpts.host, cOpts.port)

    const errorPromise = pDefer()
    const addr = `${toUri(ma)}/?remoteAddress=${encodeURIComponent(this.init.localAddress)}`
    _log('CONNECTING TO ADDR', addr)
    const peerId = ma.getPeerId() ?? 'unknown'
    const rawSocketStartedAtMs = Date.now()
    const rawSocket = connect(addr, this.init)
    rawSocket.socket.addEventListener('error', errorEvent => {
      // the WebSocket.ErrorEvent type doesn't actually give us any useful
      // information about what happened
      // https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/error_event
      this.metrics?.dialerEvents.increment({ error: true })
      const message = `Could not connect to ${ma.toString()}: ${errorEvent.message}`
      // Expected HTTP responses are common while peers are offline, starting, or not yet listening.
      if (EXPECTED_SERVER_RESPONSES.has(errorEvent.message)) {
        _log.warn(message)
        if (CONNECT_PHASE_RETRYABLE_SERVER_RESPONSES.has(errorEvent.message)) {
          const err = new RetryableWebSocketConnectError(message, errorEvent.error)
          errorPromise.reject(err)
        }
      } else {
        const err = new ConnectionFailedError(message)
        _log.error('Connection Error:', err)
        _log.error(`Original Connection Error`, errorEvent.error)
        errorPromise.reject(err)
      }
    })
    rawSocket.socket.addEventListener('close', (closeEvent: CloseEvent) => {
      _log(
        'p2p-websocket-dial %s',
        JSON.stringify({
          event: 'raw-socket:close',
          peerId,
          remoteAddr: ma.toString(),
          code: closeEvent.code,
          reason: closeEvent.reason,
          wasClean: closeEvent.wasClean,
          ageMs: Date.now() - rawSocketStartedAtMs,
          signalAborted: options.signal?.aborted ?? false,
        })
      )
    })

    try {
      options.onProgress?.(new CustomProgressEvent('websockets:open-connection'))
      await raceSignal(Promise.race([rawSocket.connected(), errorPromise.promise]), options.signal)
    } catch (err: any) {
      if (options.signal?.aborted === true) {
        this.metrics?.dialerEvents.increment({ abort: true })
      }

      rawSocket.close().catch(err => {
        _log.error('error closing raw socket', err)
      })

      throw err
    }

    _log('connected %s', ma)
    this.metrics?.dialerEvents.increment({ connect: true })
    return rawSocket
  }

  /**
   * Creates a Websockets listener. The provided `handler` function will be called
   * anytime a new incoming Connection has been successfully upgraded via
   * `upgrader.upgradeInbound`
   */
  createListener(options: CreateListenerOptions): Listener {
    return createListener(
      {
        logger: this.logger,
        events: this.components.events,
        metrics: this.components.metrics,
      },
      {
        ...this.init,
        ...options,
        targetPort: this.init.targetPort,
      }
    )
  }

  /**
   * Takes a list of `Multiaddr`s and returns only valid Websockets addresses.
   * By default, in a browser environment only DNS+WSS multiaddr is accepted,
   * while in a Node.js environment DNS+{WS, WSS} multiaddrs are accepted.
   */
  listenFilter(multiaddrs: Multiaddr[]): Multiaddr[] {
    multiaddrs = Array.isArray(multiaddrs) ? multiaddrs : [multiaddrs]

    if (this.init?.filter != null) {
      return this.init?.filter(multiaddrs)
    }

    return filters.all(multiaddrs)
  }

  /**
   * Filter check for all Multiaddrs that this transport can dial
   */
  dialFilter(multiaddrs: Multiaddr[]): Multiaddr[] {
    return this.listenFilter(multiaddrs)
  }
}

export function webSockets(init: WebSocketsInit): (components: WebSocketsComponents) => Transport {
  return components => {
    return new WebSockets(components, init)
  }
}
