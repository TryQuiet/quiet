
import withIs from 'class-is'
import WebSockets from 'libp2p-websockets'
import { AbortError } from 'abortable-iterator'
import connect from 'it-ws/client'
import { EventEmitter } from 'events'
import toUri from 'multiaddr-to-uri'
import createServer from 'it-ws/server'
import toConnection from 'libp2p-websockets/src/socket-to-conn'
import url from 'url'
import os from 'os'
import multiaddr from 'multiaddr'
import debug from 'debug'
import PeerId from 'peer-id'
import https from 'https'
import { dumpPEM } from './utils'

const log: any = debug('libp2p:websockets:listener:waggle')
log.error = debug('libp2p:websockets:listener:waggle:error')

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
      maConn = toConnection(socket, { remoteAddr: ma, signal: options.signal })
      log('new outbound connection %s', maConn.remoteAddr)
    } catch (e) {
      log.error('error creating new outbound connection %s. Details: %s', ma, e.message)
      throw e
    }

    try {
      conn = await this._upgrader.upgradeOutbound(maConn)
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

  async _connect(ma: multiaddr, options: any = {}) {
    if (options.signal?.aborted) {
      throw new AbortError()
    }
    const cOpts = ma.toOptions()
    log('dialing %s:%s', cOpts.host, cOpts.port)
    const myUri = `${toUri(ma) as string}/?remoteAddress=${encodeURIComponent(this.localAddress)}`

    const rawSocket = connect(myUri, Object.assign({ binary: true }, options))
    if (!options.signal) {
      await rawSocket.connected()

      log('connected %s', ma)
      return rawSocket
    }

    // Allow abort via signal during connect
    let onAbort
    // eslint-disable-next-line
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

  prepareListener = ({ handler, upgrader }) => {
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
      verifyClient: function (info, done) {
        done(true)
      }
    }

    const server = createServer(optionsServ, async (stream, request) => {
      let maConn, conn
      // eslint-disable-next-line
      const query = url.parse(request.url, true).query
      log('query', query.remoteAddress)
      try {
        maConn = toConnection(stream, { remoteAddr: multiaddr(query.remoteAddress.toString()) })
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

    listener.listen = (ma: multiaddr) => {
      listeningMultiaddr = ma
      return server.listen(ma.toOptions())
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
        // eslint-disable-next-line
        m = m.encapsulate('/tcp/' + address.port + '/wss')
        if (listeningMultiaddr.getPeerId()) {
          m = m.encapsulate('/p2p/' + ipfsId)
        }

        if (m.toString().indexOf('0.0.0.0') !== -1) {
          const netInterfaces = os.networkInterfaces()
          Object.keys(netInterfaces).forEach(niKey => {
            netInterfaces[niKey].forEach(ni => {
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

  // eslint-disable-next-line
  createListener(options = {}, handler) {
    if (typeof options === 'function') {
      handler = options
      options = {}
    }

    return this.prepareListener({ handler, upgrader: this._upgrader })
  }
}

export default withIs(WebsocketsOverTor, {
  className: 'WebsocketsOverTor',
  symbolName: '@libp2p/js-libp2p-websockets/websockets'
})
