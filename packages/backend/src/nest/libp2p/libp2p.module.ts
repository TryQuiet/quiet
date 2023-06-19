import { Module } from '@nestjs/common'
import { PeerId as PeerIdType } from '@quiet/types'
import { Agent } from 'http'
import { certs, onionAddress, peers, targetPort } from '../../singletons'
import { CONFIG_OPTIONS, INIT_LIBP2P_PARAMS, LIB_P2P_PROVIDER, PEER_ID_PROVIDER, SOCKS_PROXY_AGENT } from '../const'
import { LocalDbModule } from '../local-db/local-db.module'
import { SocketModule } from '../socket/socket.module'
import { StorageModule } from '../storage/storage.module'
import { Libp2pService } from './libp2p.service'
import { InitLibp2pParams, Libp2pNodeParams } from './libp2p.types'
import { createLibp2pAddress, createLibp2pListenAddress } from './libp2p.utils'
import { createLibp2p, Libp2p } from 'libp2p'
import { noise } from '@chainsafe/libp2p-noise'
import { gossipsub } from '@chainsafe/libp2p-gossipsub'
import { mplex } from '@libp2p/mplex'
import { kadDHT } from '@libp2p/kad-dht'
import { createServer } from 'it-ws'
import { webSockets } from '../../libp2p/websocketOverTor/index'
import { all } from '../../libp2p/websocketOverTor/filters'
import { ConfigOptions } from '../types'
import getPort from 'get-port'
import createHttpsProxyAgent from 'https-proxy-agent'
import { LocalDbService } from '../local-db/local-db.service'
import PeerId from 'peer-id'
import { LocalDBKeys } from '../local-db/local-db.types'
import { peerIdFromKeys } from '@libp2p/peer-id'

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

const initLibp2pParams = {
  provide: INIT_LIBP2P_PARAMS,
  useFactory: async (peerId: PeerIdType) => {
    return {
      peerId,
      address: onionAddress,
      addressPort: 443,
      targetPort,
      bootstrapMultiaddrs: peers,
      certs
    }
  },
  inject: [PEER_ID_PROVIDER],
}

const libp2pProvider = {
  provide: LIB_P2P_PROVIDER,
  useFactory: async (initParams: InitLibp2pParams, socksProxyAgent: Agent) => {
  const params: Libp2pNodeParams = {
    peerId: initParams.peerId,
    listenAddresses: [createLibp2pListenAddress(initParams.address)],
    agent: socksProxyAgent,
    localAddress: createLibp2pAddress(initParams.address, initParams.peerId.toString()),
    cert: initParams.certs.certificate,
    key: initParams.certs.key,
    ca: initParams.certs.CA,
    targetPort: initParams.targetPort
  }
  let lib: Libp2p

  const restoredRsa = await PeerId.createFromJSON(initParams.peerId)
  const _peerId = await peerIdFromKeys(restoredRsa.marshalPubKey(), restoredRsa.marshalPrivKey())
    try {
    lib = await createLibp2p({
      connectionManager: {
        minConnections: 3,
        maxConnections: 8,
        dialTimeout: 120_000,
        maxParallelDials: 10
      },
      peerId: _peerId,
      addresses: {
        listen: params.listenAddresses
      },
      streamMuxers: [mplex()],
      connectionEncryption: [noise()],
      relay: {
        enabled: false,
        hop: {
          enabled: true,
          active: false
        }
      },
      transports: [
        webSockets({
          filter: all,
          websocket: {
            agent: params.agent,
            cert: params.cert,
            key: params.key,
            ca: params.ca
          },
          localAddress: params.localAddress,
          targetPort: params.targetPort,
          createServer: createServer
        })],
      // @ts-ignore
      dht: kadDHT(),
      pubsub: gossipsub({ allowPublishToZeroPeers: true }),
    })
  } catch (err) {
   console.log('Create libp2p:', err)
    throw err
  }
  return lib
  },
  inject: [INIT_LIBP2P_PARAMS, SOCKS_PROXY_AGENT],
}

@Module({
  imports: [SocketModule],
  providers: [Libp2pService, initLibp2pParams, libp2pProvider],
  exports: [Libp2pService, initLibp2pParams, libp2pProvider]
})
export class Libp2pModule {}
