// import os from 'os'
// import { createServer } from 'it-ws/server'
// import logger from '../../logger'
// import { socketToMaConn } from './socket-to-conn.js'
// import { EventEmitter, CustomEvent } from './events'
// import type { Listener, ListenerEvents, CreateListenerOptions } from '@libp2p/interface-transport'
// import type { Server } from 'http'
// import type { WebSocketServer } from 'it-ws/server'
// import type { DuplexWebSocket } from 'it-ws/duplex'
// import type { Connection } from '@libp2p/interface-connection'
// import type { Multiaddr } from '@multiformats/multiaddr'

// const log = logger('libp2p:websockets:listener')

// // @ts-ignore
// class WebSocketListener extends EventEmitter<ListenerEvents> implements Listener {
//   private readonly connections: Set<DuplexWebSocket>
//   private listeningMultiaddr?: Multiaddr
//   private readonly server: WebSocketServer
//   multiaddr
//   protocols
//   toMultiaddr

//   constructor (init: WebSocketListenerInit) {
//     super()

//     // Keep track of open connections to destroy when the listener is closed
//     this.connections = new Set<DuplexWebSocket>()

//     const self = this // eslint-disable-line @typescript-eslint/no-this-alias

//     this.server = createServer({
//       ...init,
//       onConnection: (stream: DuplexWebSocket) => {
//         const maConn = socketToMaConn(stream, this.toMultiaddr(stream.remoteAddress ?? '', stream.remotePort ?? 0))
//         log('new inbound connection %s', maConn.remoteAddr)

//         this.connections.add(stream)

//         stream.socket.on('close', function () {
//           self.connections.delete(stream)
//         })

//         try {
//           void init.upgrader.upgradeInbound(maConn)
//             .then((conn) => {
//               log('inbound connection %s upgraded', maConn.remoteAddr)

//               if (init?.handler != null) {
//                 init?.handler(conn)
//               }

//               self.dispatchEvent(new CustomEvent<Connection>('connection', {
//                 detail: conn
//               }))
//             })
//             .catch(async err => {
//               log.error('inbound connection failed to upgrade', err)

//               await maConn.close().catch(err => {
//                 log.error('inbound connection failed to close after upgrade failed', err)
//               })
//             })
//         } catch (err) {
//           log.error('inbound connection failed to upgrade', err)
//           maConn.close().catch(err => {
//             log.error('inbound connection failed to close after upgrade failed', err)
//           })
//         }
//       }
//     })

//     this.server.on('listening', () => {
//       this.dispatchEvent(new CustomEvent('listening'))
//     })
//     this.server.on('error', (err: Error) => {
//       this.dispatchEvent(new CustomEvent('error', {
//         detail: err
//       }))
//     })
//     this.server.on('close', () => {
//       this.dispatchEvent(new CustomEvent('close'))
//     })
//   }

//   async close () {
//     await Promise.all(
//       Array.from(this.connections).map(async maConn => await maConn.close())
//     )

//     if (this.server.address() == null) {
//       // not listening, close will throw an error
//       return
//     }

//     return await this.server.close()
//   }

//   async listen (ma: Multiaddr) {

//     const { multiaddr, protocols } =  await eval("import('@multiformats/multiaddr')")
//     this.multiaddr = multiaddr
//     this.protocols = protocols
//     const { ipPortToMultiaddr } = await eval("import('@libp2p/utils/ip-port-to-multiaddr')")
//     this.toMultiaddr = ipPortToMultiaddr

//     this.listeningMultiaddr = ma

//     await this.server.listen(ma.toOptions())
//   }

//   getAddrs () {
//     const multiaddrs = []
//     const address = this.server.address()

//     if (address == null) {
//       throw new Error('Listener is not ready yet')
//     }

//     if (typeof address === 'string') {
//       throw new Error('Wrong address type received - expected AddressInfo, got string - are you trying to listen on a unix socket?')
//     }

//     if (this.listeningMultiaddr == null) {
//       throw new Error('Listener is not ready yet')
//     }

//     const ipfsId = this.listeningMultiaddr.getPeerId()
//     const protos = this.listeningMultiaddr.protos()

//     // Because TCP will only return the IPv6 version
//     // we need to capture from the passed multiaddr
//     if (protos.some(proto => proto.code === this.protocols('ip4').code)) {
//       const wsProto = protos.some(proto => proto.code === this.protocols('ws').code) ? '/ws' : '/wss'
//       let m = this.listeningMultiaddr.decapsulate('tcp')
//       m = m.encapsulate(`/tcp/${address.port}${wsProto}`)
//       if (ipfsId != null) {
//         m = m.encapsulate(`/p2p/${ipfsId}`)
//       }

//       if (m.toString().includes('0.0.0.0')) {
//         const netInterfaces = os.networkInterfaces()
//         Object.values(netInterfaces).forEach(niInfos => {
//           if (niInfos == null) {
//             return
//           }

//           niInfos.forEach(ni => {
//             if (ni.family === 'IPv4') {
//               multiaddrs.push(this.multiaddr(m.toString().replace('0.0.0.0', ni.address)))
//             }
//           })
//         })
//       } else {
//         multiaddrs.push(m)
//       }
//     }

//     return multiaddrs
//   }
// }

// export interface WebSocketListenerInit extends CreateListenerOptions {
//   server?: Server
// }

// export function createListener (init: WebSocketListenerInit): Listener {
//   //@ts-ignore
//   return new WebSocketListener(init)
// }
