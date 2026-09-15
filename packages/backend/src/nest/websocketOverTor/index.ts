// Forked from js-libp2p transport-websockets. Quiet adds remoteAddress and overlay-aware proxying.

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
  OutboundConnectionUpgradeEvents,
  Metrics,
  CounterGroup,
} from '@libp2p/interface'
import type { Multiaddr } from '@multiformats/multiaddr'
import type { Server } from 'http'
import type { DuplexWebSocket } from 'it-ws/duplex'
import type { ProgressEvent } from 'progress-events'
import type { ClientOptions } from 'ws'
import http from 'node:http'
import https from 'node:https'
import { QuietLibp2pLogger } from '../libp2p/libp2p.logger'
import { overlayFromHost } from '@quiet/common'

export interface WebSocketsInit extends AbortOptions, WebSocketOptions {
  filter?: MultiaddrFilter
  websocket?: ClientOptions
  http?: http.ServerOptions
  https?: https.ServerOptions
  inboundConnectionUpgradeTimeout?: number
  localAddress: string
  targetPort: number
  lokinetWebsocket?: ClientOptions
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
    const socket = await this._connect(ma, options)
    const maConn = socketToMaConn(socket, ma, {
      logger: this.logger,
      metrics: this.metrics?.dialerEvents,
      signal: options.signal,
    })
    const conn = await options.upgrader.upgradeOutbound(maConn, options)
    return conn
  }

  async _connect(ma: Multiaddr, options: DialTransportOptions<WebSocketsDialEvents>): Promise<DuplexWebSocket> {
    options?.signal?.throwIfAborted()
    const _log = this.components.logger.forComponent(
      `libp2p:websockets:dial:connect:${ma.getPeerId()}`
    ) as QuietLibp2pLogger
    const cOpts = ma.toOptions()
    const overlay = overlayFromHost(cOpts.host)
    _log('dialing %s:%s via %s', cOpts.host, cOpts.port, overlay)

    const errorPromise = pDefer()
    const addr = `${toUri(ma)}/?remoteAddress=${encodeURIComponent(this.init.localAddress)}`
    const connectInit =
      overlay === 'lokinet'
        ? { ...this.init, websocket: this.init.lokinetWebsocket ?? { ...this.init.websocket, agent: undefined } }
        : this.init
    const rawSocket = connect(addr, connectInit)
    rawSocket.socket.addEventListener('error', errorEvent => {
      this.metrics?.dialerEvents.increment({ error: true })
      const message = `Could not connect to ${ma.toString()}: ${errorEvent.message}`
      if (errorEvent.message === 'Unexpected server response: 404') {
        _log.warn(message)
      } else {
        const err = new ConnectionFailedError(message)
        _log.error('Connection Error:', err)
        errorPromise.reject(err)
      }
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
    this.metrics?.dialerEvents.increment({ connect: true })
    return rawSocket
  }

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

  listenFilter(multiaddrs: Multiaddr[]): Multiaddr[] {
    multiaddrs = Array.isArray(multiaddrs) ? multiaddrs : [multiaddrs]
    if (this.init?.filter != null) return this.init.filter(multiaddrs)
    return filters.all(multiaddrs)
  }

  dialFilter(multiaddrs: Multiaddr[]): Multiaddr[] {
    return this.listenFilter(multiaddrs)
  }
}

export function webSockets(init: WebSocketsInit): (components: WebSocketsComponents) => Transport {
  return components => new WebSockets(components, init)
}
