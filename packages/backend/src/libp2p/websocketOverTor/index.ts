import logger from '../../logger'
import { socketToMaConn } from './socket-to-conn'
import * as filters from './filters'

import { MultiaddrFilter, CreateListenerOptions, DialOptions } from '@libp2p/interface-transport'
import type { AbortOptions } from '@libp2p/interfaces'
import type { Multiaddr } from '@multiformats/multiaddr'

import type { ClientOptions, ErrorEvent } from 'ws'

import os from 'os'
import PeerId from 'peer-id'

import url from 'url'

import type { Server } from 'http'
import https from 'https'

import { EventEmitter } from 'events'

import { dumpPEM } from '../utils'

import pDefer from 'p-defer'
import { multiaddrToUri as toUri } from '@multiformats/multiaddr-to-uri'
import { AbortError } from '@libp2p/interfaces/errors'
import { connect } from 'it-ws'
import { ServerOptions, WebSocketServer as ItWsWebsocketServer } from 'it-ws/server'
import { multiaddr } from '@multiformats/multiaddr'
import { MultiaddrConnection, Connection } from '@libp2p/interface-connection'

const log = logger('libp2p:websockets')

const symbol = Symbol.for('@libp2p/transport')

export interface WebSocketServer extends ItWsWebsocketServer {
  __connections?: MultiaddrConnection[]
}

export interface WebSocketsInit extends AbortOptions {
  filter?: MultiaddrFilter
  websocket: ClientOptions
  server?: Server
  localAddress: string
  targetPort: number
  createServer: (opts?: ServerOptions) => WebSocketServer
}

class Discovery extends EventEmitter {
  tag: string
  constructor() {
    super()
    this.tag = 'channel_18'
  }

  stop() { }
  start() { }
  end() { }
}

export class WebSockets extends EventEmitter {
  private readonly init?: WebSocketsInit

  _websocketOpts: ClientOptions
  localAddress: string
  discovery: Discovery
  targetPort: number
  createServer: (opts?: ServerOptions) => WebSocketServer

  constructor({ websocket, localAddress, targetPort, createServer }: WebSocketsInit) {
    super()

    this._websocketOpts = websocket
    this.localAddress = localAddress
    this.discovery = new Discovery()
    this.targetPort = targetPort
    this.createServer = createServer
  }

  get [Symbol.toStringTag]() {
    return '@libp2p/websockets'
  }

  get [symbol](): true {
    return true
  }

  async dial(ma: Multiaddr, options: DialOptions) {
    let conn: Connection
    let socket
    let maConn: MultiaddrConnection

    try {
      socket = await this._connect(ma, {
        websocket: {
          ...this._websocketOpts,
          ...this.certData
        }
      })
    } catch (e) {
      log.error('error connecting to %s. Details: %s', ma, e.message)
      throw e
    }
    try {
      maConn = socketToMaConn(socket, ma, { signal: options.signal })
      log('new outbound connection %s', maConn.remoteAddr)
    } catch (e) {
      log.error('error creating new outbound connection %s. Details: %s', ma, e.message)
      throw e
    }

    try {
      conn = await options.upgrader.upgradeOutbound(maConn)
      log('outbound connection %s upgraded', maConn.remoteAddr)
      return conn
    } catch (e) {
      log.error('error upgrading outbound connection %s. Details: %s', maConn.remoteAddr, e.message)
      throw e
    }
  }

  get certData() {
    const { cert, key, ca } = this._websocketOpts
    if (!cert || !key || !ca || ca?.length) {
      return {}
    }
    let _ca: string | Buffer
    if (Array.isArray(ca)) {
      _ca = ca[0]
    } else {
      _ca = ca
    }
    return {
      cert: dumpPEM('CERTIFICATE', cert.toString()),
      key: dumpPEM('PRIVATE KEY', key.toString()),
      ca: [dumpPEM('CERTIFICATE', _ca.toString())]
    }
  }

  async _connect(ma: Multiaddr, options: any = {}) {
    if (options.signal?.aborted) {
      throw new AbortError()
    }
    const cOpts = ma.toOptions()
    log('connect %s:%s', cOpts.host, cOpts.port)

    const errorPromise = pDefer()
    const errfn = (event: ErrorEvent) => {
      log.error(`connection error: ${event.message}`)
      errorPromise.reject(event)
    }

    const myUri = `${toUri(ma)}/?remoteAddress=${encodeURIComponent(
      this.localAddress
    )}`
    const rawSocket = connect(myUri, Object.assign({ binary: true }, options))

    if (rawSocket.socket.on) {
      rawSocket.socket.on('error', errfn)
    } else {
      rawSocket.socket.onerror = errfn
    }

    if (!options.signal) {
      await Promise.race([rawSocket.connected(), errorPromise.promise])

      log(`${this.localAddress} connected %s`, ma)
      return rawSocket
    }

    // Allow abort via signal during connect
    let onAbort
    // eslint-disable-next-line
    const abort = new Promise((_resolve, reject) => {
      onAbort = () => {
        reject(new AbortError())
        rawSocket.close().catch(err => {
          log.error('error closing raw socket', err)
        })
      }

      // Already aborted?
      if (options.signal.aborted) return onAbort()
      options.signal.addEventListener('abort', onAbort)
    })

    try {
      await Promise.race([abort, errorPromise.promise, rawSocket.connected()])
    } finally {
      options.signal.removeEventListener('abort', onAbort)
    }

    log('connected %s', ma)
    return rawSocket
  }

  /**
   * Creates a Websockets listener. The provided `handler` function will be called
   * anytime a new incoming Connection has been successfully upgraded via
   * `upgrader.upgradeInbound`
   */
  prepareListener = ({ handler, upgrader }: CreateListenerOptions): any => {
    console.log('preparing listener')
    log('prepareListener')
    const listener: any = new EventEmitter()

    const trackConn = (server: WebSocketServer, maConn: MultiaddrConnection) => {
      server.__connections?.push(maConn)
    }

    const serverHttps = https.createServer({
      ...this.certData,
      requestCert: true,
      enableTrace: false
    })

    const optionsServ = {
      server: serverHttps,
      verifyClient: function (_info: any, done: (res: boolean) => void) {
        done(true)
      }
    }

    const server = this.createServer(optionsServ)
    server.__connections = []

    server.on('connection', async (stream, request) => {
      let maConn: MultiaddrConnection
      let conn: Connection
      // eslint-disable-next-line
      const query = url.parse(request.url, true).query
      log('server connecting with', query.remoteAddress)
      if (!query.remoteAddress) return

      const remoteAddress = query.remoteAddress.toString()
      try {
        maConn = socketToMaConn(stream, multiaddr(remoteAddress))
        const peer = {
          id: PeerId.createFromB58String(remoteAddress.split('/p2p/')[1]),
          multiaddrs: [maConn.remoteAddr]
        }
        this.discovery.emit('peer', peer)
        log('new inbound connection %s', maConn.remoteAddr)
      } catch (e) {
        log.error(`Failed to convert stream into a MultiaddrConnection for ${remoteAddress}:`, e)
        return
      }

      try {
        conn = await upgrader.upgradeInbound(maConn)
      } catch (err) {
        log.error('inbound connection failed to upgrade', err)
        return await maConn?.close()
      }

      log('inbound connection %s upgraded', maConn.remoteAddr)

      trackConn(server, maConn)

      if (handler) handler(conn)
      listener.emit('connection', conn)
    })
      .on('listening', () => listener.emit('listening'))
      .on('error', err => listener.emit('error', err))
      .on('close', () => listener.emit('close'))

    // Keep track of open connections to destroy in case of timeout

    let listeningMultiaddr: Multiaddr

    listener.close = async () => {
      server.__connections?.forEach(async maConn => await maConn.close())
      return await server.close()
    }

    listener.addEventListener = () => { }

    listener.listen = async (ma: Multiaddr) => {
      listeningMultiaddr = ma

      const listenOptions = {
        ...ma.toOptions(),
        port: this.targetPort
      }

      return await server.listen(listenOptions)
    }

    listener.getAddrs = () => {
      const multiaddrs: Multiaddr[] = []
      const address = server.address()
      if (!address) {
        throw new Error('Listener is not ready yet')
      }

      const ipfsId: string | null = listeningMultiaddr.getPeerId()

      // Because TCP will only return the IPv6 version
      // we need to capture from the passed multiaddr
      if (listeningMultiaddr.toString().includes('ip4')) {
        let m = listeningMultiaddr.decapsulate('tcp')
        m = m.encapsulate('/tcp/443/wss')
        if (ipfsId) {
          m = m.encapsulate('/p2p/' + ipfsId)
        }

        if (m.toString().includes('0.0.0.0')) {
          const netInterfaces = os.networkInterfaces()
          Object.keys(netInterfaces).forEach(niKey => {
            netInterfaces[niKey]?.forEach(ni => {
              if (ni.family === 'IPv4') {
                multiaddrs.push(multiaddr(m.toString().replace('0.0.0.0', ni.address)))
              }
            })
          })
        } else {
          multiaddrs.push(m)
        }
      }
      return multiaddrs
    }
    return listener
  }

  createListener(options: CreateListenerOptions) {
    // if (typeof options === 'function') {
    //   // TODO: is it needed?
    //   handler = options
    //   options = {}
    // }

    return this.prepareListener(options)
  }

  /**
   * Takes a list of `Multiaddr`s and returns only valid Websockets addresses.
   * By default, in a browser environment only DNS+WSS multiaddr is accepted,
   * while in a Node.js environment DNS+{WS, WSS} multiaddrs are accepted.
   */
  filter(multiaddrs: Multiaddr[]) {
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

export function webSockets(init: WebSocketsInit): (components?: any) => WebSockets {
  return () => {
    return new WebSockets(init)
  }
}
