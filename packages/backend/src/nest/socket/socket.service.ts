import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import {
  SocketActions,
  SocketEvents,
  type CreateChannelPayload,
  type CreateChannelResponse,
  SendMessagePayload,
  UploadFilePayload,
  DownloadFilePayload,
  CancelDownloadPayload,
  GetMessagesPayload,
  ConnectionProcessInfo,
  InitCommunityPayload,
  Community,
  DeleteFilesFromChannelSocketPayload,
  type UserProfile,
  type DeleteChannelResponse,
  type MessagesLoadedPayload,
  type NetworkInfo,
  LaunchCommunityPayload,
  ResponseJoinCommunityPayload,
  ResponseCreateCommunityPayload,
} from '@quiet/types'
import EventEmitter from 'events'
import { CONFIG_OPTIONS, SERVER_IO_PROVIDER } from '../const'
import { ConfigOptions, ServerIoProviderTypes } from '../types'
import { suspendableSocketEvents } from './suspendable.events'
import { createLogger } from '../common/logger'
import type net from 'node:net'
import { Base58, InviteResult } from '@localfirst/auth'

/**
 * Handles socket connections with the state-manager.
 * Consumers can listen to events emitted by this service
 * to receive incoming events from the state-manager
 */
@Injectable()
export class SocketService extends EventEmitter implements OnModuleInit {
  private readonly logger = createLogger(SocketService.name)

  public resolveReadyness: (value: void | PromiseLike<void>) => void
  public readyness: Promise<void>
  private sockets: Set<net.Socket>

  constructor(
    @Inject(SERVER_IO_PROVIDER) public readonly serverIoProvider: ServerIoProviderTypes,
    @Inject(CONFIG_OPTIONS) public readonly configOptions: ConfigOptions
  ) {
    super()

    this.readyness = new Promise<void>(resolve => {
      this.resolveReadyness = resolve
    })

    this.sockets = new Set<net.Socket>()

    this.attachListeners()
  }

  public emit(event: string | symbol, ...args: any[]): boolean {
    this.logger.info(`Emitting event: ${String(event)}`)
    return super.emit(event, ...args)
  }

  async onModuleInit() {
    this.logger.info('init: Started')
    await this.init()
    this.logger.info('init: Finished')
  }

  public async init() {
    const connection = new Promise<void>(resolve => {
      this.serverIoProvider.io.on(SocketActions.CONNECTION, socket => {
        socket.on(SocketActions.START, async () => {
          resolve()
        })
      })
    })

    await this.listen()

    this.logger.info('init: Waiting for frontend to connect')
    await connection
    this.logger.info('init: Frontend connected')
  }

  private readonly attachListeners = () => {
    this.logger.info('Attaching listeners')

    // Attach listeners here
    this.serverIoProvider.io.on(SocketActions.CONNECTION, socket => {
      this.logger.info('Socket connection')

      socket.on(SocketActions.CLOSE, async () => {
        this.logger.info('Socket connection closed')
        this.emit(SocketActions.CLOSE)
      })

      socket.use(async (event, next) => {
        const type = event[0]
        if (suspendableSocketEvents.includes(type)) {
          this.logger.info('Awaiting readyness before emitting: ', type)
          await this.readyness
        }
        next()
      })

      // ====== Channels =====
      socket.on(
        SocketActions.CREATE_CHANNEL,
        (payload: CreateChannelPayload, callback: (response: CreateChannelResponse) => void) => {
          this.emit(SocketActions.CREATE_CHANNEL, payload, callback)
        }
      )

      socket.on(
        SocketActions.DELETE_CHANNEL,
        async (
          payload: { channelId: string; ownerPeerId: string },
          callback: (response: DeleteChannelResponse) => void
        ) => {
          this.emit(SocketActions.DELETE_CHANNEL, payload, callback)
        }
      )

      // ====== Messages ======
      socket.on(SocketActions.SEND_MESSAGE, async (payload: SendMessagePayload) => {
        this.emit(SocketActions.SEND_MESSAGE, payload)
      })

      socket.on(
        SocketActions.GET_MESSAGES,
        (payload: GetMessagesPayload, callback: (response?: MessagesLoadedPayload) => void) => {
          this.emit(SocketActions.GET_MESSAGES, payload, callback)
        }
      )

      // ====== Files ======
      socket.on(SocketActions.UPLOAD_FILE, async (payload: UploadFilePayload) => {
        this.emit(SocketActions.UPLOAD_FILE, payload.file)
      })

      socket.on(SocketActions.DOWNLOAD_FILE, async (payload: DownloadFilePayload) => {
        this.emit(SocketActions.DOWNLOAD_FILE, payload.metadata)
      })

      socket.on(SocketActions.CANCEL_DOWNLOAD, async (payload: CancelDownloadPayload) => {
        this.emit(SocketActions.CANCEL_DOWNLOAD, payload.mid)
      })

      socket.on(SocketActions.DELETE_FILES_FROM_CHANNEL, async (payload: DeleteFilesFromChannelSocketPayload) => {
        this.emit(SocketActions.DELETE_FILES_FROM_CHANNEL, payload)
      })

      // ====== Community ======
      socket.on(
        SocketActions.CREATE_COMMUNITY,
        async (
          payload: InitCommunityPayload,
          callback: (response: ResponseCreateCommunityPayload | undefined) => void
        ) => {
          this.logger.info(`Creating community`, payload.id)
          this.emit(SocketActions.CREATE_COMMUNITY, payload, callback)
        }
      )

      socket.on(
        SocketActions.JOIN_COMMUNITY,
        async (
          payload: InitCommunityPayload,
          callback: (response: ResponseJoinCommunityPayload | undefined) => void
        ) => {
          this.logger.info(`Received request to join community`, payload.id)
          this.emit(SocketActions.JOIN_COMMUNITY, payload, callback)
          this.emit(SocketEvents.CONNECTION_PROCESS_INFO, ConnectionProcessInfo.LAUNCHING_COMMUNITY)
        }
      )

      // socket.on(SocketActions.LAUNCH_COMMUNITY, async (payload: LaunchCommunityPayload) => {
      //   this.logger.info(`Launching community ${payload.id}`)
      //   this.emit(SocketActions.LAUNCH_COMMUNITY, payload)
      // })

      socket.on(SocketActions.LEAVE_COMMUNITY, (callback: (closed: boolean) => void) => {
        this.logger.info('Leaving community')
        this.emit(SocketActions.LEAVE_COMMUNITY, callback)
      })

      // ====== Users ======

      socket.on(SocketActions.SET_USER_PROFILE, (profile: UserProfile) => {
        this.emit(SocketActions.SET_USER_PROFILE, profile)
      })

      // ====== Local First Auth ======

      socket.on(
        SocketActions.VALIDATE_OR_CREATE_LONG_LIVED_LFA_INVITE,
        async (inviteId: Base58, callback: (response: InviteResult | undefined) => void) => {
          this.logger.info(`Validating long lived LFA invite with ID ${inviteId} or creating a new one`)
          this.emit(SocketActions.VALIDATE_OR_CREATE_LONG_LIVED_LFA_INVITE, inviteId, callback)
        }
      )

      socket.on(SocketEvents.CREATED_LONG_LIVED_LFA_INVITE, (invite: InviteResult) => {
        this.logger.info(`Created new long lived LFA invite code with id ${invite.id}`)
        this.emit(SocketEvents.CREATED_LONG_LIVED_LFA_INVITE, invite)
      })

      // ====== Misc ======

      socket.on(SocketActions.LOAD_MIGRATION_DATA, async (data: Record<string, any>) => {
        this.emit(SocketActions.LOAD_MIGRATION_DATA, data)
      })
    })

    // Ensure the underlying connections get closed. See:
    // https://github.com/socketio/socket.io/issues/1602
    this.serverIoProvider.server.on('connection', conn => {
      this.sockets.add(conn)
      conn.on('close', () => {
        this.sockets.delete(conn)
      })
    })
  }

  public getConnections = (): Promise<number> => {
    return new Promise(resolve => {
      this.serverIoProvider.server.getConnections((err, count) => {
        if (err) {
          this.logger.error(`Error occurred while getting connection`, err)
          throw new Error(`Error occurred while getting connection: ${err.message}`)
        }
        resolve(count)
      })
    })
  }

  // Ensure the underlying connections get closed. See:
  // https://github.com/socketio/socket.io/issues/1602
  //
  // I also tried `this.serverIoProvider.io.disconnectSockets(true)`
  // which didn't work for me, but we still call it.
  public closeSockets = () => {
    this.logger.info('Disconnecting sockets')
    this.serverIoProvider.io.disconnectSockets(true)
    this.sockets.forEach(s => s.destroy())
    this.serverIoProvider.io.close()
  }

  public listen = async (): Promise<void> => {
    this.logger.info(`Opening data server on port ${this.configOptions.socketIOPort}`)

    if (this.serverIoProvider.server.listening) {
      this.logger.warn('Failed to listen. Server already listening.')
      return
    }

    const numConnections = await this.getConnections()

    if (numConnections > 0) {
      this.logger.warn('Failed to listen. Connections still open:', numConnections)
      return
    }

    return new Promise(resolve => {
      this.serverIoProvider.server.listen(this.configOptions.socketIOPort, '127.0.0.1', () => {
        this.logger.info(`Data server running on port ${this.configOptions.socketIOPort}`)
        resolve()
      })
    })
  }

  public close = (): Promise<void> => {
    return new Promise(resolve => {
      this.logger.info(`Closing data server on port ${this.configOptions.socketIOPort}`)

      if (!this.serverIoProvider.server.listening) {
        this.logger.warn('Data server is not running.')
        resolve()
        return
      }

      this.serverIoProvider.io.close(err => {
        if (err) {
          this.logger.error(`Error occurred while closing data server on port ${this.configOptions.socketIOPort}`, err)
          throw new Error(
            `Error occurred while closing data server on port ${this.configOptions.socketIOPort}: ${err.message}`
          )
        }
        this.logger.info('Data server closed')
        resolve()
      })

      this.closeSockets()
    })
  }
}
