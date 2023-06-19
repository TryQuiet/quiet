import { Module } from '@nestjs/common'
import e from 'cors'
import getPort from 'get-port'
import createHttpsProxyAgent from 'https-proxy-agent'
import PeerId from 'peer-id'
import { CONFIG_OPTIONS, PEER_ID_PROVIDER, SOCKS_PROXY_AGENT } from '../const'
import { IpfsFileManagerModule } from '../ipfs-file-manager/ipfs-file-manager.module'
import { Libp2pModule } from '../libp2p/libp2p.module'
import { LocalDbModule } from '../local-db/local-db.module'
import { LocalDbService } from '../local-db/local-db.service'
import { LocalDBKeys } from '../local-db/local-db.types'
import { RegistrationModule } from '../registration/registration.module'
import { SocketModule } from '../socket/socket.module'
import { StorageModule } from '../storage/storage.module'
import { TorModule } from '../tor/tor.module'
import { ConnectionsManagerService } from './connections-manager.service'

// export const socksProxyAgentProvider = {
//   provide: SOCKS_PROXY_AGENT,
//   useFactory: async (configOptions: ConfigOptions) => {
//   if (!configOptions.httpTunnelPort) {
//     configOptions.httpTunnelPort = await getPort()
//   }
//   return createHttpsProxyAgent({
//     port: configOptions.httpTunnelPort, host: '127.0.0.1',
//   })
//   },
//   inject: [CONFIG_OPTIONS]
// }

@Module({
  imports: [RegistrationModule, StorageModule, TorModule],
  providers: [ConnectionsManagerService],
  exports: [ConnectionsManagerService]
})
export class ConnectionsManagerModule {}
