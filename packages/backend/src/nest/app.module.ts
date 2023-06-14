import { Global, Module } from '@nestjs/common'
import { SocketModule } from './socket/socket.module'
import { ConnectionsManagerModule } from './connections-manager/connections-manager.module'
import { TorManagerModule } from './tor-manager/tor-manager.module'
import { RegistrationModule } from './registration/registration.module'
import { IpfsFileManagerModule } from './ipfs-file-manager/ipfs-file-manager.module'
import path from 'path'
import { CONFIG_OPTIONS, EXPRESS_PROVIDER, SERVER_IO_PROVIDER, IPFS_REPO_PATCH, ORBIT_DB_DIR, QUIET_DIR, QUIET_DIR_PATH } from './const'
import type { IPFS } from 'ipfs-core'
import { ConfigOptions, ConnectionsManagerOptions, ConnectionsManagerTypes } from './types'
import { LocalDbModule } from './local-db/local-db.module'
import { Libp2pModule } from './libp2p/libp2p.module';
import express from 'express'

@Global()
@Module({
  imports: [SocketModule, ConnectionsManagerModule, TorManagerModule, RegistrationModule, IpfsFileManagerModule, LocalDbModule, Libp2pModule],
  // controllers: [],
  providers: [
    {
      provide: EXPRESS_PROVIDER,
      useValue: express(),
    }
    // {
    //   provide: IPFS,
    //   useClass: IPFS,
    // },

    // {
    //   provide: ORBIT_DB_DIR,
    //   useFactory: (_quietDir: string) => path.join(QUIET_DIR, ORBIT_DB_DIR),
    //   inject: [QUIET_DIR]
    // },
    // {
    //   provide: IPFS_REPO_PATCH,
    //   useFactory: (_quietDir: string) => path.join(QUIET_DIR, ORBIT_DB_DIR),
    //   inject: [QUIET_DIR]
    // },
    // {
    //   provide: QUIET_DIR,
    //   useFactory: (QUIET_DIR_PATH: string) => this.options.env?.appDataPath || QUIET_DIR_PATH,
    //   inject: [QUIET_DIR_PATH]
    // }

    // this.ipfsRepoPath = path.join(this.quietDir, this.options.ipfsDir || Config.IPFS_REPO_PATH)
  ],
  exports: [EXPRESS_PROVIDER]
})
export class AppModule {
    static forOptions(options: ConnectionsManagerTypes) {
        const configOptions: ConfigOptions = { ...options, ...new ConnectionsManagerOptions() }
        return {
          module: AppModule,
          providers: [{
            provide: CONFIG_OPTIONS,
            useValue: configOptions,
          },
            {
      provide: QUIET_DIR,
      useFactory: () => configOptions.env?.appDataPath || QUIET_DIR_PATH,
    },

  ],
          exports: [CONFIG_OPTIONS, QUIET_DIR],
        }
      }
}


   //   this.quietDir = this.options.env?.appDataPath || QUIET_DIR_PATH

// protected async initIPFS(libp2p: any, peerID: any): Promise<IPFS> {
//   log('Initializing IPFS')
//   this.emit(SocketActionTypes.CONNECTION_PROCESS_INFO, ConnectionProcessInfo.INITIALIZING_IPFS)
//   return await create({
//     libp2p: async () => libp2p,
//     preload: { enabled: false },
//     repo: this.ipfsRepoPath,
//     EXPERIMENTAL: {
//       ipnsPubsub: true
//     },
//     init: {
//       privateKey: peerID
//     }
//   })
// }
