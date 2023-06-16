import { Module } from '@nestjs/common'
import PeerId from 'peer-id'
import { socksProxyAgentProvider } from '../connections-manager/connections-manager.module'
import { INIT_LIBP2P_PARAMS, PEER_ID_PROVIDER } from '../const'
import { LocalDbModule } from '../local-db/local-db.module'
import { LocalDbService } from '../local-db/local-db.service'
import { LocalDBKeys } from '../local-db/local-db.types'
import { SocketModule } from '../socket/socket.module'
import { Libp2pService } from './libp2p.service'


// KACPER
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

const initLibp2pParams = {
  provide: INIT_LIBP2P_PARAMS,
  useFactory: async (params: IJakisTyp) => {
    return {
      peerId: params.peerId,
      address: params.onionAddress,
      addressPort: 443,
      targetPort: params.targetPort,
      bootstrapMultiaddrs: peers,
      certs: params.certs
    }
  },
  inject: [TO_CO_PROVIDUJE_PARAMS],
}

@Module({
  imports: [LocalDbModule, SocketModule],
  providers: [Libp2pService, socksProxyAgentProvider, initLibp2pParams, peerIdProvider],
  exports: [Libp2pService]
})
export class Libp2pModule {}
