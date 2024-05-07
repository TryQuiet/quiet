import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import {
  SocketActionTypes,
  type CreateChannelPayload,
  type CreateChannelResponse,
  SendMessagePayload,
  UploadFilePayload,
  DownloadFilePayload,
  CancelDownloadPayload,
  GetMessagesPayload,
  ConnectionProcessInfo,
  RegisterOwnerCertificatePayload,
  SaveOwnerCertificatePayload,
  InitCommunityPayload,
  Community,
  DeleteFilesFromChannelSocketPayload,
  SaveCSRPayload,
  CommunityMetadata,
  type PermsData,
  type UserProfile,
  type DeleteChannelResponse,
  type MessagesLoadedPayload,
  type NetworkInfo,
} from '@quiet/types'
import EventEmitter from 'events'
import { CONFIG_OPTIONS, SERVER_IO_PROVIDER } from '../const'
import { ConfigOptions, ServerIoProviderTypes } from '../types'
import { suspendableSocketEvents } from './suspendable.events'
import Logger from '../common/logger'
import { sleep } from '../common/sleep'
import type net from 'node:net'

@Injectable()
export class SocketService extends EventEmitter implements OnModuleInit {
  private readonly logger = Logger(SocketService.name)

  public resolveReadyness: (value: void | PromiseLike<void>) => void
  public readyness: Promise<void>
  private listening: boolean
  private closeSockets: () => void

  constructor(
    @Inject(SERVER_IO_PROVIDER) public readonly serverIoProvider: ServerIoProviderTypes,
    @Inject(CONFIG_OPTIONS) public readonly configOptions: ConfigOptions
  ) {
    super()

    this.readyness = new Promise<void>(resolve => {
      this.resolveReadyness = resolve
    })

    this.listening = false
    this.closeSockets = this.attachListeners()
  }

  async onModuleInit() {
    this.logger('init: Started')

    await this.init()

    this.logger('init: Finished')
  }

  public async init() {
    const connection = new Promise<void>(resolve => {
      this.serverIoProvider.io.on(SocketActionTypes.CONNECTION, socket => {
        socket.on(SocketActionTypes.START, async () => {
          resolve()
        })
      })
    })

    await this.listen()

    this.logger('init: Waiting for frontend to connect')
    await connection
    this.logger('init: Frontend connected')
  }

  private readonly attachListeners = (): (() => void) => {
    // Attach listeners here
    this.serverIoProvider.io.on(SocketActionTypes.CONNECTION, socket => {
      this.logger('Socket connection')

      // On websocket connection, update presentation service with network data
      this.emit(SocketActionTypes.CONNECTION)

      socket.on(SocketActionTypes.CLOSE, async () => {
        this.logger('Socket connection closed')
        this.emit(SocketActionTypes.CLOSE)
      })

      socket.use(async (event, next) => {
        const type = event[0]
        if (suspendableSocketEvents.includes(type)) {
          this.logger('Awaiting readyness before emitting: ', type)
          await this.readyness
        }
        next()
      })

      // ====== Channels =====
      socket.on(
        SocketActionTypes.CREATE_CHANNEL,
        (payload: CreateChannelPayload, callback: (response: CreateChannelResponse) => void) => {
          this.emit(SocketActionTypes.CREATE_CHANNEL, payload, callback)
        }
      )

      socket.on(
        SocketActionTypes.DELETE_CHANNEL,
        async (
          payload: { channelId: string; ownerPeerId: string },
          callback: (response: DeleteChannelResponse) => void
        ) => {
          this.emit(SocketActionTypes.DELETE_CHANNEL, payload, callback)
        }
      )

      // ====== Messages ======
      socket.on(SocketActionTypes.SEND_MESSAGE, async (payload: SendMessagePayload) => {
        this.emit(SocketActionTypes.SEND_MESSAGE, payload)
      })

      socket.on(
        SocketActionTypes.GET_MESSAGES,
        (payload: GetMessagesPayload, callback: (response?: MessagesLoadedPayload) => void) => {
          this.emit(SocketActionTypes.GET_MESSAGES, payload, callback)
        }
      )

      // ====== Files ======
      socket.on(SocketActionTypes.UPLOAD_FILE, async (payload: UploadFilePayload) => {
        this.emit(SocketActionTypes.UPLOAD_FILE, payload.file)
      })

      socket.on(SocketActionTypes.DOWNLOAD_FILE, async (payload: DownloadFilePayload) => {
        this.emit(SocketActionTypes.DOWNLOAD_FILE, payload.metadata)
      })

      socket.on(SocketActionTypes.CANCEL_DOWNLOAD, async (payload: CancelDownloadPayload) => {
        this.emit(SocketActionTypes.CANCEL_DOWNLOAD, payload.mid)
      })

      socket.on(SocketActionTypes.DELETE_FILES_FROM_CHANNEL, async (payload: DeleteFilesFromChannelSocketPayload) => {
        this.emit(SocketActionTypes.DELETE_FILES_FROM_CHANNEL, payload)
      })

      // ====== Certificates ======
      socket.on(SocketActionTypes.ADD_CSR, async (payload: SaveCSRPayload) => {
        this.logger(`On ${SocketActionTypes.ADD_CSR}`)

        this.emit(SocketActionTypes.ADD_CSR, payload)
      })

      // ====== Community ======
      socket.on(
        SocketActionTypes.CREATE_COMMUNITY,
        async (payload: InitCommunityPayload, callback: (response: Community | undefined) => void) => {
          this.logger(`Creating community ${payload.id}`)
          this.emit(SocketActionTypes.CREATE_COMMUNITY, payload, callback)
        }
      )

      socket.on(
        SocketActionTypes.LAUNCH_COMMUNITY,
        async (payload: InitCommunityPayload, callback: (response: Community | undefined) => void) => {
          this.logger(`Launching community ${payload.id} for ${payload.peerId.id}`)
          this.emit(SocketActionTypes.LAUNCH_COMMUNITY, payload, callback)
          this.emit(SocketActionTypes.CONNECTION_PROCESS_INFO, ConnectionProcessInfo.LAUNCHING_COMMUNITY)
        }
      )

      socket.on(
        SocketActionTypes.CREATE_NETWORK,
        async (communityId: string, callback: (response: NetworkInfo | undefined) => void) => {
          this.logger(`Creating network for community ${communityId}`)
          this.emit(SocketActionTypes.CREATE_NETWORK, communityId, callback)
        }
      )

      socket.on(SocketActionTypes.LEAVE_COMMUNITY, async (callback: (closed: boolean) => void) => {
        this.logger('Leaving community')
        this.emit(SocketActionTypes.LEAVE_COMMUNITY, callback)
      })

      socket.on(SocketActionTypes.LIBP2P_PSK_STORED, payload => {
        this.logger('Saving PSK', payload)
        this.emit(SocketActionTypes.LIBP2P_PSK_STORED, payload)
      })

      // ====== Users ======

      socket.on(SocketActionTypes.SET_USER_PROFILE, (profile: UserProfile) => {
        this.emit(SocketActionTypes.SET_USER_PROFILE, profile)
      })

      // ====== Misc ======

      socket.on(SocketActionTypes.LOAD_MIGRATION_DATA, async (data: Record<string, any>) => {
        this.emit(SocketActionTypes.LOAD_MIGRATION_DATA, data)
      })
    })

    // Ensure the underlying connections get closed. See:
    // https://github.com/socketio/socket.io/issues/1602
    //
    // I also tried `this.serverIoProvider.io.disconnectSockets(true)`
    // which didn't work for me.
    const sockets = new Set<net.Socket>()

    this.serverIoProvider.server.on('connection', conn => {
      sockets.add(conn)
      conn.on('close', () => {
        sockets.delete(conn)
      })
    })

    return () => sockets.forEach(s => s.destroy())
  }

  public getConnections = (): Promise<number> => {
    return new Promise(resolve => {
      this.serverIoProvider.server.getConnections((err, count) => {
        if (err) throw new Error(err.message)
        resolve(count)
      })
    })
  }

  public listen = async (port = this.configOptions.socketIOPort): Promise<void> => {
    this.logger(`Opening data server on port ${this.configOptions.socketIOPort}`)

    // Sometimes socket.io closes the HTTP server but doesn't close
    // all underlying connections. So it doesn't appear that
    // `this.serverIoProvider.server.listening` is sufficient.
    if (this.listening) {
      const numConnections = await this.getConnections()
      this.logger('Failed to listen. Connections still open:', numConnections)
      return
    }

    return await new Promise(resolve => {
      this.serverIoProvider.server.listen(this.configOptions.socketIOPort, '127.0.0.1', () => {
        this.logger(`Data server running on port ${this.configOptions.socketIOPort}`)
        this.listening = true
        resolve()
      })
    })
  }

  public close = (): Promise<void> => {
    return new Promise(resolve => {
      this.logger(`Closing data server on port ${this.configOptions.socketIOPort}`)
      this.serverIoProvider.io.close(err => {
        if (err) throw new Error(err.message)
        this.logger('Data server closed')
        this.listening = false
        resolve()
      })
      this.logger('Disconnecting sockets')
      this.closeSockets()
    })
  }
}
