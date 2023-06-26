import { Module } from '@nestjs/common'
import { SocketModule } from '../socket/socket.module'
import { Libp2pService } from './libp2p.service'

// const peerIdProvider = {
//   provide: PEER_ID_PROVIDER,
//  useFactory: async (localDbService: LocalDbService) => {
//   const isPeerId = await localDbService.get(LocalDBKeys.PEER_ID)
//   if (isPeerId) {
//     return isPeerId
//   } else {
//     const newPeerId: PeerId = await PeerId.create()
//     await localDbService.put(LocalDBKeys.PEER_ID, newPeerId)
//     return newPeerId
//   }
//  },
//  inject: [LocalDbService]
// }

// const socksProxyAgentProvider =
//   {
//     provide: SOCKS_PROXY_AGENT,
//     useFactory: async (configOptions: ConfigOptions) => {
//     if (!configOptions.httpTunnelPort) {
//       configOptions.httpTunnelPort = await getPort()
//     }
//     return createHttpsProxyAgent({
//       port: configOptions.httpTunnelPort, host: '127.0.0.1',
//     })
//     },
//     inject: [CONFIG_OPTIONS]
//   }
// class Args {
//   private args: any |null = null
//     get(): any {
//       if (!this.args) {
//         throw new Error('error')
//       }
//       return this.args
//     }

//     set(value: any) {
//       this.args = value
//     }
// }
// const authDataProvider = {
//   provide: AUTH_DATA_PROVIDER,
//   useFactory: async (socketService: SocketService) => {
//     return new Args()
//     // return await new Promise((resolve) => {
//     //   socketService.on(SocketActionTypes.LAUNCH_COMMUNITY, async (args) => {
//     //     console.log({ args })
//     //       resolve(args)
//     //   })
//     // })
//   },
//   inject: [SocketService],
// }

// // 0. init wszystkich modulow i providerow
// // 1.user
// // 2.libp2p
// const initLibp2pParams = {
//   provide: INIT_LIBP2P_PARAMS,
//   useFactory: async (peerId: PeerIdType) => {
//     return {
//       peerId,
//       address: onionAddress,
//       addressPort: 443,
//       targetPort,
//       bootstrapMultiaddrs: peers,
//       certs
//     }
//   },
//   inject: [PEER_ID_PROVIDER],
// }

// const libp2pProvider = {
//   provide: LIB_P2P_PROVIDER,
//   useFactory: async (initParams: InitLibp2pParams, socksProxyAgent: Agent, authDataProvider: any) => {
//     console.log('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!')
//     authDataProvider.set('xd')
//     console.log({ authDataProvider })
//     console.log('authDataProvider.get()', authDataProvider.get())

//   const params: Libp2pNodeParams = {
//     peerId: initParams.peerId,
//     listenAddresses: [createLibp2pListenAddress(initParams.address)],
//     agent: socksProxyAgent,
//     localAddress: createLibp2pAddress(initParams.address, initParams.peerId.toString()),
//     cert: initParams.certs.certificate,
//     key: initParams.certs.key,
//     ca: initParams.certs.CA,
//     targetPort: initParams.targetPort
//   }
//   let lib

//   const restoredRsa = await PeerId.createFromJSON(initParams.peerId)
//   const _peerId = await peerIdFromKeys(restoredRsa.marshalPubKey(), restoredRsa.marshalPrivKey())
//     try {
//     lib = await createLibp2p({
//       connectionManager: {
//         minConnections: 3,
//         maxConnections: 8,
//         dialTimeout: 120_000,
//         maxParallelDials: 10
//       },
//       peerId: _peerId,
//       addresses: {
//         // listen: params.listenAddresses
//       },
//       streamMuxers: [mplex()],
//       connectionEncryption: [noise()],
//       relay: {
//         enabled: false,
//         hop: {
//           enabled: true,
//           active: false
//         }
//       },
//       transports: [webSockets()],
//       dht: kadDHT(),
//       pubsub: gossipsub({ allowPublishToZeroPeers: true }),
//     })
//   } catch (err) {
//    console.log('Create libp2p:', err)
//     throw err
//   }
//   return lib
//   },
//   inject: [INIT_LIBP2P_PARAMS, SOCKS_PROXY_AGENT, AUTH_DATA_PROVIDER],
// }

@Module({
  imports: [SocketModule],
  providers: [Libp2pService],
  exports: [Libp2pService]
})
export class Libp2pModule { }
