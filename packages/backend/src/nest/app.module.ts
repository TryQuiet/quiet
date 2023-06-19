import { Global, Module } from '@nestjs/common'
import { SocketModule } from './socket/socket.module'
import { ConnectionsManagerModule } from './connections-manager/connections-manager.module'
import { RegistrationModule } from './registration/registration.module'
import { IpfsFileManagerModule } from './ipfs-file-manager/ipfs-file-manager.module'
import path from 'path'
import { CONFIG_OPTIONS, EXPRESS_PROVIDER, SERVER_IO_PROVIDER, IPFS_REPO_PATCH, ORBIT_DB_DIR, QUIET_DIR, QUIET_DIR_PATH, Config, TOR_CONTROL_PARAMS, SOCKS_PROXY_AGENT, PEER_ID_PROVIDER } from './const'
import type { IPFS } from 'ipfs-core'
import { ConfigOptions, ConnectionsManagerOptions, ConnectionsManagerTypes } from './types'
import { LocalDbModule } from './local-db/local-db.module'
import { Libp2pModule } from './libp2p/libp2p.module'
import { TorModule } from './tor/tor.module'
import express from 'express'
import { TorControlAuthType } from './tor/tor.types'
import createHttpsProxyAgent from 'https-proxy-agent'
import getPort from 'get-port'
import PeerId from 'peer-id'
import { LocalDbService } from './local-db/local-db.service'
import { LocalDBKeys } from './local-db/local-db.types'
import { peerId } from '../singletons'
import { createServer } from 'http'
import { Server as SocketIO } from 'socket.io'

// KACPER
@Global()
@Module({
  imports: [SocketModule, ConnectionsManagerModule, RegistrationModule, IpfsFileManagerModule, LocalDbModule, Libp2pModule, TorModule],
  providers: [
    {
      provide: EXPRESS_PROVIDER,
      useValue: express(),
    },

  ],
  exports: [EXPRESS_PROVIDER]
})
export class AppModule {
    static forOptions(options: ConnectionsManagerTypes) {
        const configOptions: ConfigOptions = { ...options, ...new ConnectionsManagerOptions() }
        return {
          module: AppModule,
          providers: [
            {
              provide: CONFIG_OPTIONS,
              useValue: configOptions,
            },
            {
              provide: QUIET_DIR,
              useFactory: () => configOptions.env?.appDataPath || QUIET_DIR_PATH,
            },
            {
              provide: ORBIT_DB_DIR,
              useFactory: (_quietDir: string) => path.join(_quietDir, Config.ORBIT_DB_DIR),
              inject: [QUIET_DIR]
            },
            {
              provide: IPFS_REPO_PATCH,
              useFactory: (_quietDir: string) => path.join(_quietDir, Config.IPFS_REPO_PATH),
              inject: [QUIET_DIR]
            },
            {
              provide: PEER_ID_PROVIDER,
              useFactory: async() => {
              if (!peerId.get()) {
                peerId.set(await PeerId.create())
              }

              return peerId.get()
              },
              inject: [QUIET_DIR]
            },
{
            provide: SERVER_IO_PROVIDER,
            useFactory: (expressProvider: express.Application) => {
              const _app = expressProvider
              // _app.use(cors())
              const server = createServer(_app)
             const io = new SocketIO(server, {
                // cors: this.cors,
                pingInterval: 1000_000,
                pingTimeout: 1000_000
              })
              return { server, io }
            },
            inject: [EXPRESS_PROVIDER],
          },
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
          }

  ],
          exports: [CONFIG_OPTIONS, QUIET_DIR, ORBIT_DB_DIR, IPFS_REPO_PATCH, PEER_ID_PROVIDER, SERVER_IO_PROVIDER, SOCKS_PROXY_AGENT],
        }
      }
}
