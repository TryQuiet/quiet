import { Global, Module } from '@nestjs/common'
import { SocketModule } from './socket/socket.module'
import { ConnectionsManagerModule } from './connections-manager/connections-manager.module'
import { RegistrationModule } from './registration/registration.module'
import { IpfsFileManagerModule } from './ipfs-file-manager/ipfs-file-manager.module'
import path from 'path'
import fs from 'fs'

import cors from 'cors'
import {
  CONFIG_OPTIONS,
  EXPRESS_PROVIDER,
  SERVER_IO_PROVIDER,
  IPFS_REPO_PATCH,
  ORBIT_DB_DIR,
  QUIET_DIR,
  QUIET_DIR_PATH,
  Config,
  SOCKS_PROXY_AGENT,
  LEVEL_DB,
  DB_PATH,
} from './const'
import { ConfigOptions, ConnectionsManagerOptions, ConnectionsManagerTypes } from './types'
import { LocalDbModule } from './local-db/local-db.module'
import { Libp2pModule } from './libp2p/libp2p.module'
import { TorModule } from './tor/tor.module'
import express from 'express'
import createHttpsProxyAgent from 'https-proxy-agent'
import getPort from 'get-port'
import { createServer } from 'http'
import { Server as SocketIO } from 'socket.io'
import { StorageModule } from './storage/storage.module'
import { IpfsModule } from './ipfs/ipfs.module'
import { Level } from 'level'
import { verifyToken } from '@quiet/common'

@Global()
@Module({
  imports: [
    SocketModule,
    ConnectionsManagerModule,
    RegistrationModule,
    IpfsFileManagerModule,
    LocalDbModule,
    Libp2pModule,
    TorModule,
    StorageModule,
    IpfsModule,
  ],
  providers: [
    {
      provide: EXPRESS_PROVIDER,
      useFactory: () => express(),
    },
  ],
  exports: [EXPRESS_PROVIDER],
})
export class AppModule {
  static forOptions(options: ConnectionsManagerTypes) {
    const configOptions: ConfigOptions = { ...options, ...new ConnectionsManagerOptions() }
    console.log('configOptions', configOptions)
    return {
      module: AppModule,
      providers: [
        {
          provide: CONFIG_OPTIONS,
          useValue: configOptions,
        },
        {
          provide: QUIET_DIR,
          useFactory: () => configOptions.options?.env?.appDataPath || QUIET_DIR_PATH,
        },
        {
          provide: ORBIT_DB_DIR,
          useFactory: (_quietDir: string) => {
            const existingRepo = fs.readdirSync(_quietDir).filter(i => i.startsWith('OrbitDB'))
            return path.join(_quietDir, existingRepo[0] || Config.ORBIT_DB_DIR)
          },
          inject: [QUIET_DIR],
        },
        {
          provide: IPFS_REPO_PATCH,
          useFactory: (_quietDir: string) => {
            const existingRepo = fs.readdirSync(_quietDir).filter(i => i.startsWith('Ipfs'))
            return path.join(_quietDir, existingRepo[0] || Config.IPFS_REPO_PATH)
          },
          inject: [QUIET_DIR],
        },

        {
          provide: SERVER_IO_PROVIDER,
          useFactory: async (expressProvider: express.Application) => {
            const _app = expressProvider
            _app.use(cors())
            const server = createServer(_app)
            const io = new SocketIO(server, {
              cors: {
                origin: '127.0.0.1',
                allowedHeaders: ['authorization'],
                credentials: true,
              },
              pingInterval: 1000_000,
              pingTimeout: 1000_000,
            })
            io.engine.use((req, res, next) => {
              const authHeader = req.headers['authorization']
              if (!authHeader) {
                console.error('No authorization header')
                res.writeHead(401, 'No authorization header')
                res.end()
                return
              }

              const token = authHeader && authHeader.split(' ')[1]
              if (!token) {
                console.error('No auth token')
                res.writeHead(401, 'No authorization token')
                res.end()
                return
              }

              if (verifyToken(options.socketIOSecret, token)) {
                next()
              } else {
                console.error('Wrong basic token')
                res.writeHead(401, 'Unauthorized')
                res.end()
              }
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
              port: configOptions.httpTunnelPort,
              host: '127.0.0.1',
            })
          },
          inject: [CONFIG_OPTIONS],
        },
        {
          provide: DB_PATH,
          useFactory: (baseDir: string) => path.join(baseDir, 'backendDB'),
          inject: [QUIET_DIR],
        },
        {
          provide: LEVEL_DB,
          useFactory: (dbPath: string) => new Level<string, unknown>(dbPath, { valueEncoding: 'json' }),
          inject: [DB_PATH],
        },
      ],
      exports: [
        CONFIG_OPTIONS,
        QUIET_DIR,
        ORBIT_DB_DIR,
        IPFS_REPO_PATCH,
        SERVER_IO_PROVIDER,
        SOCKS_PROXY_AGENT,
        LEVEL_DB,
      ],
    }
  }
}
