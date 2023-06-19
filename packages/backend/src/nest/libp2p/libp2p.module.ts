import { Module } from '@nestjs/common'
import PeerId from 'peer-id'
import { certs, onionAddress, peers, targetPort } from '../../singletons'
import { socksProxyAgentProvider } from '../connections-manager/connections-manager.module'
import { INIT_LIBP2P_PARAMS, PEER_ID_PROVIDER } from '../const'
import { LocalDbModule } from '../local-db/local-db.module'
import { SocketModule } from '../socket/socket.module'
import { StorageModule } from '../storage/storage.module'
import { Libp2pService } from './libp2p.service'

const initLibp2pParams = {
  provide: INIT_LIBP2P_PARAMS,
  useFactory: async (peerId: PeerId) => {
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

@Module({
  imports: [LocalDbModule, SocketModule, StorageModule],
  providers: [Libp2pService, socksProxyAgentProvider, initLibp2pParams],
  exports: [Libp2pService]
})
export class Libp2pModule {}
