import { Global, Module } from '@nestjs/common'
import { SocketModule } from './socket/socket.module'
import { ConnectionsManagerModule } from './connections-manager/connections-manager.module'
import { IpfsFileManagerModule } from './ipfs-file-manager/ipfs-file-manager.module'
import { ImageCompressionModule } from './image-compression/image-compression.module'
import path from 'path'
import fs from 'fs'

// @ts-ignore
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
  LIBP2P_DB_PATH,
  QSS_ALLOWED,
  QSS_ENDPOINT,
} from './const'
import { ConfigOptions, ConnectionsManagerOptions, ConnectionsManagerTypes } from './types'
import { LocalDbModule } from './local-db/local-db.module'
import { Libp2pModule } from './libp2p/libp2p.module'
import { TorModule } from './tor/tor.module'
import express from 'express'
import { HttpsProxyAgent } from 'https-proxy-agent'
import getPort from 'get-port'
import { createServer } from 'http'
import { Server as SocketIO } from 'socket.io'
import { StorageModule } from './storage/storage.module'
import { IpfsModule } from './ipfs/ipfs.module'
import { Level } from 'level'
import { createLogger } from './common/logger'
import { SocketActionsMap, SocketEventsMap } from '@quiet/types'
import { QSSModule } from './qss/qss.module'
import { verifyToken } from './common/token'
import { OrbitDbModule } from './storage/orbitDb/orbitdb.module'

const logger = createLogger('appModule')

@Global()
@Module({
  imports: [
    SocketModule,
    LocalDbModule,
    Libp2pModule,
    IpfsModule,
    ImageCompressionModule,
    IpfsFileManagerModule,
    OrbitDbModule,
    StorageModule,
    ConnectionsManagerModule,
    TorModule,
    QSSModule,
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
            const _ioLogger = logger.extend('serverIoProvider')
            const _app = expressProvider
            _app.use(cors())
            const server = createServer(_app)
            const io = new SocketIO<SocketActionsMap, SocketEventsMap>(server, {
              cors: {
                origin: '127.0.0.1',
                allowedHeaders: ['authorization', 'Upgrade', 'Connection'],
                credentials: true,
              },
              allowUpgrades: true,
              pingInterval: 60_000,
              pingTimeout: 30_000,
            })
            // @ts-ignore
            io.engine.use(async (req, res, next) => {
              const authHeader = req.headers['authorization']
              if (!authHeader) {
                _ioLogger.error('Backend server: No authorization header')
                res.writeHead(401, 'No authorization header')
                res.end()
                return
              }
              // Require Bearer token
              const match = /^Bearer (.+)$/.exec(authHeader)
              if (!match) {
                _ioLogger.error('Backend server: Invalid or missing Bearer token')
                res.writeHead(401, 'Invalid or missing Bearer token')
                res.end()
                return
              }
              const token = match[1]
              if (!token) {
                _ioLogger.error('Backend server: No auth token')
                res.writeHead(401, 'No authorization token')
                res.end()
                return
              }

              if (await verifyToken(options.socketIOSecret, token)) {
                next()
              } else {
                _ioLogger.error('Backend server: Unauthorized')
                res.writeHead(401, 'Unauthorized')
                res.end()
              }
            })

            io.engine.on('connection_error', err => {
              _ioLogger.error('Server IO connection error', err.message, err.code, err.context, err)
            })

            io.on('connection', socket => {
              _ioLogger.info(`New server io connection`, socket.conn.transport.name, socket.client.conn.remoteAddress)
              socket.conn.on('close', reason => {
                _ioLogger.warn('Underlying connection closed on server IO', reason)
              })
              socket.on('disconnect', reason => {
                _ioLogger.warn('Client disconnected from server IO', reason)
              })
              socket.on('error', err => {
                _ioLogger.error('Error on server IO client connection', err)
              })

              socket.conn.once('upgrade', () => {
                _ioLogger.trace('Server IO client connection transport upgraded', socket.conn.transport.name)
              })
            })
            _ioLogger.info('ok')
            return { server, io }
          },
          inject: [EXPRESS_PROVIDER],
        },
        {
          provide: SOCKS_PROXY_AGENT,
          useFactory: async (configOptions: ConfigOptions): Promise<HttpsProxyAgent<string>> => {
            if (!configOptions.httpTunnelPort) {
              configOptions.httpTunnelPort = await getPort()
            }
            return new HttpsProxyAgent(`http://127.0.0.1:${configOptions.httpTunnelPort}`)
          },
          inject: [CONFIG_OPTIONS],
        },
        {
          provide: DB_PATH,
          useFactory: (baseDir: string) => path.join(baseDir, 'backendDB'),
          inject: [QUIET_DIR],
        },
        {
          provide: LIBP2P_DB_PATH,
          useFactory: (baseDir: string) => path.join(baseDir, 'libp2pDatastore'),
          inject: [QUIET_DIR],
        },
        {
          provide: LEVEL_DB,
          useFactory: (dbPath: string) =>
            new Level<string, any>(dbPath, {
              valueEncoding: 'json',
              createIfMissing: true,
              errorIfExists: false,
              keyEncoding: 'utf-8',
            }),
          inject: [DB_PATH],
        },
        {
          provide: QSS_ALLOWED,
          useValue: process.env.QSS_ALLOWED === 'true',
        },
        {
          provide: QSS_ENDPOINT,
          useValue: process.env.QSS_ENDPOINT,
        },
      ],
      exports: [
        CONFIG_OPTIONS,
        QUIET_DIR,
        ORBIT_DB_DIR,
        IPFS_REPO_PATCH,
        LIBP2P_DB_PATH,
        SERVER_IO_PROVIDER,
        SOCKS_PROXY_AGENT,
        LEVEL_DB,
        QSS_ALLOWED,
        QSS_ENDPOINT,
      ],
    }
  }
}
