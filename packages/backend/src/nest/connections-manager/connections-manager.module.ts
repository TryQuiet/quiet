import { Module } from '@nestjs/common'
import getPort from 'get-port'
import createHttpsProxyAgent from 'https-proxy-agent'
import { CONFIG_OPTIONS, SOCKS_PROXY_AGENT } from '../const'
import { Libp2pModule } from '../libp2p/libp2p.module'
import { LocalDbModule } from '../local-db/local-db.module'
import { RegistrationModule } from '../registration/registration.module'
import { SocketModule } from '../socket/socket.module'
import { StorageModule } from '../storage/storage.module'
import { TorModule } from '../tor/tor.module'
import { ConfigOptions } from '../types'
import { ConnectionsManagerService } from './connections-manager.service'

@Module({
  imports: [SocketModule, RegistrationModule, LocalDbModule, StorageModule, Libp2pModule, TorModule],
  providers: [ConnectionsManagerService,

    {
      provide: SOCKS_PROXY_AGENT,
      useFactory: async (configOptions: ConfigOptions) => {
      if (!configOptions.httpTunnelPort) {
        configOptions.httpTunnelPort = await getPort()
      }
      return createHttpsProxyAgent({
        port: configOptions.httpTunnelPort, host: '127.0.0.1',
      })
      },
      inject: [CONFIG_OPTIONS]
    },

  ],
  exports: [ConnectionsManagerService]
})
export class ConnectionsManagerModule {}
