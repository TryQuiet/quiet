import withIs from 'class-is'
import WebSockets from 'libp2p-websockets'
import { AbortError } from 'abortable-iterator'
import connect from 'it-ws/client'
import { EventEmitter } from 'events'
import toUri from 'multiaddr-to-uri'
import { createServer } from 'it-ws'
import toConnection from 'libp2p-websockets/src/socket-to-conn'
import url from 'url'
import os from 'os'
import multiaddr from 'multiaddr'
import debug from 'debug'
import PeerId from 'peer-id'
const log: any = debug('libp2p:websockets:listener')
log.error = debug('libp2p:websockets:listener:error')

class Discovery extends EventEmitter {
  tag: string
  constructor() {
    super()
    this.tag = 'channel_18'
  }
  start() {}
}

class WebsocketsOverTor extends WebSockets {
  _websocketOpts: any
  _upgrader: any
  localAddress: string
  discovery: Discovery
  constructor({ upgrader, websocket, localAddr }) {
    super({ upgrader })
    this._websocketOpts = websocket
    this.localAddress = localAddr
    this._upgrader = upgrader
    this.discovery = new Discovery()
  }
  async dial(ma, options: any = {}) {
    log('dialing %s', ma)
    // console.log('dialing')
    let conn
    try {
      const socket = await this._connect(ma, { websocket: this._websocketOpts, ...options, localAddr: this.localAddress  })
      const maConn = toConnection(socket, { remoteAddr: ma, signal: options.signal })
      log('new outbound connection %s', maConn.remoteAddr)
  
      conn = await this._upgrader.upgradeOutbound(maConn)
      log('outbound connection %s upgraded', maConn.remoteAddr)
      return conn
    } catch (e) {
      console.log('error with peer redialing')
    }
  }

  async _connect (ma, options: any = {}) {
    if (options.signal && options.signal.aborted) {
      throw new AbortError()
    }
    const cOpts = ma.toOptions()
    log('dialing %s:%s', cOpts.host, cOpts.port)
    const myUri = `${toUri(ma)}/?remoteAddress=${encodeURIComponent(this.localAddress)}`
    const rawSocket = connect(myUri, Object.assign({ binary: true }, options))
    if (!options.signal) {
      await rawSocket.connected()

      log('connected %s', ma)
      return rawSocket
    }

    // Allow abort via signal during connect
    let onAbort
    const abort = new Promise((resolve, reject) => {
      onAbort = () => {
        reject(new AbortError())
        rawSocket.close()
      }

      // Already aborted?
      if (options.signal.aborted) return onAbort()
      options.signal.addEventListener('abort', onAbort)
    })

    try {
      await Promise.race([abort, rawSocket.connected()])
    } finally {
      options.signal.removeEventListener('abort', onAbort)
    }

    log('connected %s', ma)
    return rawSocket
  }

  prepareListener = ({ handler, upgrader }, options = {}) => {
    const listener: any = new EventEmitter()
    const trackConn = (server, maConn) => {
      server.__connections.push(maConn)
    }
    const server = createServer(options, async (stream, request) => {
      let maConn, conn
      let query = url.parse(request.url, true).query
      // console.log('request', request)
      // console.log('query', query)
      console.log('query', query.remoteAddress)
      try {
        maConn = toConnection(stream, { remoteAddr: multiaddr(query.remoteAddress.toString()) })
        const peer = { 
          id: PeerId.createFromB58String(query.remoteAddress.toString().split('/p2p/')[1]),
          multiaddrs: [maConn.remoteAddr],
        }
        this.discovery.emit('peer', peer)
        log('new inbound connection %s', maConn.remoteAddr)
        conn = await upgrader.upgradeInbound(maConn)
      } catch (err) {
        console.log('error', err)
        log.error('inbound connection failed to upgrade', err)
        return maConn && maConn.close()
      }
  
      log('inbound connection %s upgraded', maConn.remoteAddr)
  
      trackConn(server, maConn)
  
      if (handler) handler(conn)
      listener.emit('connection', conn)
    })

    server
      .on('listening', () => listener.emit('listening'))
      .on('error', err => listener.emit('error', err))
      .on('close', () => listener.emit('close'))

    // Keep track of open connections to destroy in case of timeout
    server.__connections = []

    let listeningMultiaddr
  
    listener.close = () => {
      server.__connections.forEach(maConn => maConn.close())
      return server.close()
    }
  
    listener.listen = (ma) => {
      listeningMultiaddr = ma
  
      return server.listen(ma.toOptions())
    }
  
    listener.getAddrs = () => {
      const multiaddrs = []
      const address = server.address()
  
      if (!address) {
        throw new Error('Listener is not ready yet')
      }
  
      const ipfsId = listeningMultiaddr.getPeerId()
  
      // Because TCP will only return the IPv6 version
      // we need to capture from the passed multiaddr
      if (listeningMultiaddr.toString().indexOf('ip4') !== -1) {
        let m = listeningMultiaddr.decapsulate('tcp')
        m = m.encapsulate('/tcp/' + address.port + '/ws')
        if (listeningMultiaddr.getPeerId()) {
          m = m.encapsulate('/p2p/' + ipfsId)
        }
  
        if (m.toString().indexOf('0.0.0.0') !== -1) {
          const netInterfaces = os.networkInterfaces()
          Object.keys(netInterfaces).forEach((niKey) => {
            netInterfaces[niKey].forEach((ni) => {
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

  createListener (options = {}, handler) {
    if (typeof options === 'function') {
      handler = options
      options = {}
    }

    return this.prepareListener({ handler, upgrader: this._upgrader }, options)
  }
}

export default withIs(WebsocketsOverTor, {
  className: 'WebsocketsOverTor',
  symbolName: '@libp2p/js-libp2p-websockets/websockets',
});
