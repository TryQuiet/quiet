import pDefer from 'p-defer'
import logger from '../../logger'
import { socketToMaConn } from './socket-to-conn.js'
import * as filters from './filters.js'
import { MultiaddrFilter } from '@libp2p/interface-transport'
import type { AbortOptions } from '@libp2p/interfaces'
import type { Multiaddr } from '@multiformats/multiaddr'
import type { DuplexWebSocket } from 'it-ws/duplex'
import type { ClientOptions } from 'ws'

import os from 'os'
import PeerId from 'peer-id'

import url from 'url'

import type { Server } from 'http'
import https from 'https'

import { EventEmitter } from 'events'

import { dumpPEM } from '../utils'
import { connected } from 'process'



const log = logger('libp2p:websockets')

const symbol = Symbol.for('@libp2p/transport')

export interface WebSocketsInit extends AbortOptions {
  filter?: MultiaddrFilter
  websocket: ClientOptions
  server?: Server
  localAddress: string
  targetPort: number
  createServer
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

class WebSockets extends EventEmitter{
  private readonly init?: WebSocketsInit
  toUri
  AbortError
  multiaddr

  _websocketOpts: any
  localAddress: string
  discovery: Discovery
  peerId: string
  targetPort: number
  connect
  createServer

  constructor({ websocket, localAddress, targetPort, createServer }) {
    super()

    this._websocketOpts = websocket
    this.localAddress = localAddress
    this.peerId = localAddress.split('/').pop()
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

  async dial(ma, options: any = {}) {
    let conn
    let socket
    let maConn

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
    let ca: string
    if (Array.isArray(this._websocketOpts.ca)) {
      ca = this._websocketOpts.ca[0]
    } else {
      ca = this._websocketOpts.ca
    }
    return {
      cert: dumpPEM('CERTIFICATE', this._websocketOpts.cert),
      key: dumpPEM('PRIVATE KEY', this._websocketOpts.key),
      ca: [dumpPEM('CERTIFICATE', ca)]
    }
  }



  async _connect(ma: Multiaddr, options: any = {}) {
    if (!this.toUri) {
      const { multiaddrToUri } = await eval("import('@multiformats/multiaddr-to-uri')")
      this.toUri = multiaddrToUri
    }
    if (!this.AbortError) {
      const { AbortError } = await eval("import('@libp2p/interfaces/errors')")
      this.AbortError = AbortError
    }
    if (!this.connect) {
      const { connect } = await eval("import('it-ws/client')")
      this.connect = connect
    }

    if (options.signal?.aborted) {
      throw new this.AbortError()
    }
    const cOpts = ma.toOptions()
    log('connect %s:%s', cOpts.host, cOpts.port)

    const errorPromise = pDefer()
    const errfn = (err) => {
      const msg = `connection error: ${err.message as string}`
      log.error(msg)

      errorPromise.reject(err)
    }

    const myUri = `${this.toUri(ma) as string}/?remoteAddress=${encodeURIComponent(this.localAddress)}`
    const rawSocket = this.connect(myUri, Object.assign({ binary: true }, options))

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
        reject(new this.AbortError())
        // FIXME: https://github.com/libp2p/js-libp2p-websockets/issues/121
        setTimeout(() => {
          rawSocket.close()
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
   prepareListener = ({ handler, upgrader }) => {
    console.log('preparing listener')
    log('prepareListener')
    const listener: any = new EventEmitter()
    
    const trackConn = (server, maConn) => {
      server.__connections.push(maConn)
    }

    const serverHttps = https.createServer({
      ...this.certData,
      requestCert: true,
      enableTrace: false
    })

    const optionsServ = {
      server: serverHttps,
      // eslint-disable-next-line
      verifyClient: function (_info, done) {
        done(true)
      }
    }

    const server = this.createServer(optionsServ)
    server.__connections = []

    server.on('connection', async (stream, request) => {
      if (!this.multiaddr) {
        const {multiaddr} = await eval("import('@multiformats/multiaddr')")
        this.multiaddr = multiaddr
      }
      let maConn, conn
      // eslint-disable-next-line
      const query = url.parse(request.url, true).query
      log('server', query.remoteAddress)
      try {
        maConn = socketToMaConn(stream, this.multiaddr(query.remoteAddress.toString()) )
        const peer = {
          id: PeerId.createFromB58String(query.remoteAddress.toString().split('/p2p/')[1]),
          multiaddrs: [maConn.remoteAddr]
        }
        this.discovery.emit('peer', peer)
        log('new inbound connection %s', maConn.remoteAddr)
        conn = await upgrader.upgradeInbound(maConn)
      } catch (err) {
        log.error('inbound connection failed to upgrade', err)
        return maConn?.close()
      }

      log('inbound connection %s upgraded', maConn.remoteAddr)

      trackConn(server, maConn)

      if (handler) handler(conn)
      listener.emit('connection', conn)
    } )
      .on('listening', () => listener.emit('listening'))
      .on('error', err => listener.emit('error', err))
      .on('close', () => listener.emit('close'))

    //Keep track of open connections to destroy in case of timeout

    let listeningMultiaddr

    listener.close = () => {
     server.__connections.forEach(maConn => maConn.close())
      return server.close()
    }

    listener.addEventListener = () => {

    }

    listener.listen = (ma: Multiaddr) => {
      listeningMultiaddr = ma

      const listenOptions = {
        ...ma.toOptions(),
        port: this.targetPort
      }

      return server.listen(listenOptions)
    }

    listener.getAddrs = () => {
      const multiaddrs = []
      const address = server.address()
      if (!address) {
        throw new Error('Listener is not ready yet')
      }

      const ipfsId: string = listeningMultiaddr.getPeerId()

      // Because TCP will only return the IPv6 version
      // we need to capture from the passed multiaddr
      if (listeningMultiaddr.toString().indexOf('ip4') !== -1) {
        let m = listeningMultiaddr.decapsulate('tcp')
        m = m.encapsulate('/tcp/443/wss')
        if (listeningMultiaddr.getPeerId()) {
          m = m.encapsulate('/p2p/' + ipfsId)
        }

        if (m.toString().indexOf('0.0.0.0') !== -1) {
          const netInterfaces = os.networkInterfaces()
          Object.keys(netInterfaces).forEach(niKey => {
            netInterfaces[niKey].forEach(ni => {
              if (ni.family === 'IPv4') {
                multiaddrs.push(this.multiaddr(m.toString().replace('0.0.0.0', ni.address)))
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

  // eslint-disable-next-line
  createListener(options, handler) {
    if (typeof options === 'function') {
      handler = options
      options = {}
    }

    return this.prepareListener({ handler, upgrader: options.upgrader })
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

export function webSockets(init: WebSocketsInit): (components?: any) => any {
  return () => {
    return new WebSockets(init)
  }
}
