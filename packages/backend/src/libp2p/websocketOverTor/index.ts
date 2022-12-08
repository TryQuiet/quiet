import { connect, WebSocketOptions } from 'it-ws/client'
//import { multiaddrToUri as toUri } from '@multiformats/multiaddr-to-uri'
//import { AbortError } from '@libp2p/interfaces/errors'
import pDefer from 'p-defer'
import logger from '../../logger'
import { isBrowser, isWebWorker } from 'wherearewe'
import { createListener } from './listener.js'
import { socketToMaConn } from './socket-to-conn.js'
import * as filters from './filters.js'
import { MultiaddrFilter, CreateListenerOptions, DialOptions } from '@libp2p/interface-transport'
import type { Connection } from '@libp2p/interface-connection'
import type { AbortOptions } from '@libp2p/interfaces'
import type { Multiaddr } from '@multiformats/multiaddr'
import type { DuplexWebSocket } from 'it-ws/duplex'
import type { ClientOptions } from 'ws'
import type { Server } from 'http'

const log = logger('libp2p:websockets')

const symbol = Symbol.for('@libp2p/transport')

export interface WebSocketsInit extends AbortOptions, WebSocketOptions {
  filter?: MultiaddrFilter
  websocket?: ClientOptions
  server?: Server
}

class WebSockets {
  private readonly init?: WebSocketsInit
  toUri
  AbortError

  constructor (init?: WebSocketsInit) {
    this.init = init
  }

  get [Symbol.toStringTag] () {
    return '@libp2p/websockets'
  }

  get [symbol] (): true {
    return true
  }

  async dial (ma: Multiaddr, options: DialOptions): Promise<Connection> {
    log('dialing %s', ma)
    // @ts-ignore
    options = options ?? {}

    const socket = await this._connect(ma, options)
    const maConn = socketToMaConn(socket, ma)
    log('new outbound connection %s', maConn.remoteAddr)

    const conn = await options.upgrader.upgradeOutbound(maConn)
    log('outbound connection %s upgraded', maConn.remoteAddr)
    return conn
  }

  async _connect (ma: Multiaddr, options: AbortOptions): Promise<DuplexWebSocket> {
if (!this.toUri) {
  const { multiaddrToUri } = await eval("import('@multiformats/multiaddr-to-uri')")
  this.toUri = multiaddrToUri
}
if (!this.AbortError) {
  const {AbortError} = await eval("import('@libp2p/interfaces/errors')")
  this.AbortError = AbortError
}
    if (options?.signal?.aborted === true) {
      throw new this.AbortError()
    }
    const cOpts = ma.toOptions()
    log('dialing %s:%s', cOpts.host, cOpts.port)

    const errorPromise = pDefer()
    const errfn = (err: any) => {
      log.error('connection error:', err)

      errorPromise.reject(err)
    }

    const rawSocket = connect(this.toUri(ma), this.init)

    if (rawSocket.socket.on != null) {
      rawSocket.socket.on('error', errfn)
    } else {
      rawSocket.socket.onerror = errfn
    }

    if (options.signal == null) {
      await Promise.race([rawSocket.connected(), errorPromise.promise])

      log('connected %s', ma)
      return rawSocket
    }

    // Allow abort via signal during connect
    let onAbort
    const abort = new Promise((resolve, reject) => {
      onAbort = () => {
        reject(new this.AbortError())
        rawSocket.close().catch(err => {
          log.error('error closing raw socket', err)
        })
      }

      // Already aborted?
      if (options?.signal?.aborted === true) {
        return onAbort()
      }

      options?.signal?.addEventListener('abort', onAbort)
    })

    try {
      await Promise.race([abort, errorPromise.promise, rawSocket.connected()])
    } finally {
      if (onAbort != null) {
        options?.signal?.removeEventListener('abort', onAbort)
      }
    }

    log('connected %s', ma)
    return rawSocket
  }

  /**
   * Creates a Websockets listener. The provided `handler` function will be called
   * anytime a new incoming Connection has been successfully upgraded via
   * `upgrader.upgradeInbound`
   */
  createListener (options: CreateListenerOptions) {
    return createListener({ ...this.init, ...options })
  }

  /**
   * Takes a list of `Multiaddr`s and returns only valid Websockets addresses.
   * By default, in a browser environment only DNS+WSS multiaddr is accepted,
   * while in a Node.js environment DNS+{WS, WSS} multiaddrs are accepted.
   */
  filter (multiaddrs: Multiaddr[]) {
    multiaddrs = Array.isArray(multiaddrs) ? multiaddrs : [multiaddrs]

    if (this.init?.filter != null) {
      return this.init?.filter(multiaddrs)
    }

    // Browser
    // Probably we don't need browser atm
    // if (isBrowser || isWebWorker) {
    //   return filters.dnsWss(multiaddrs)
    // }

    return filters.all(multiaddrs)
  }
}

export function webSockets (init: WebSocketsInit = {}): (components?: any) => any {
  return () => {
    return new WebSockets(init)
  }
}
