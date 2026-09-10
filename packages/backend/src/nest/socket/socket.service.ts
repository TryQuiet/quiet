import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import {
  SocketActions,
  SocketEvents,
  type CreateChannelPayload,
  type CreateChannelResponse,
  SendMessagePayload,
  AttachFilePayload,
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
  SetUserProfileResponse,
  SetUserProfilePayload,
  type HCaptchaFormResponse,
  InviteResultWithSalt,
  AddMembersChannelPayload,
  AddMembersChannelResponse,
  UserProfilesUpdatedPayload,
} from '@quiet/types'
import EventEmitter from 'events'
import { CONFIG_OPTIONS, SERVER_IO_PROVIDER } from '../const'
import { ConfigOptions, ServerIoProviderTypes } from '../types'
import { suspendableSocketEvents } from './suspendable.events'
import { createLogger } from '../common/logger'
import net from 'node:net'
import { Base58 } from '@localfirst/auth'

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
  private recoveryInFlight?: Promise<void>
  private closing = false

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

      socket.on(
        SocketActions.ADD_MEMBERS_TO_CHANNEL,
        async (payload: AddMembersChannelPayload, callback: (response: AddMembersChannelResponse) => void) => {
          this.emit(SocketActions.ADD_MEMBERS_TO_CHANNEL, payload, callback)
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
      socket.on(SocketActions.ATTACH_FILE, async (payload: AttachFilePayload) => {
        this.emit(SocketActions.ATTACH_FILE, payload.file)
      })

      socket.on(SocketActions.DOWNLOAD_FILE, async (payload: DownloadFilePayload) => {
        this.emit(SocketActions.DOWNLOAD_FILE, payload)
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

      socket.on(SocketActions.LAUNCH_COMMUNITY, async (payload: LaunchCommunityPayload) => {
        this.logger.info(`Launching community ${payload.id}`)
        this.emit(SocketActions.LAUNCH_COMMUNITY, payload)
      })

      socket.on(SocketActions.LEAVE_COMMUNITY, (callback: (closed: boolean) => void) => {
        this.logger.info('Leaving community')
        this.emit(SocketActions.LEAVE_COMMUNITY, callback)
      })

      // ====== Users ======

      socket.on(
        SocketActions.SET_USER_PROFILE,
        (profile: SetUserProfilePayload, callback: (response: SetUserProfileResponse) => void) => {
          this.emit(SocketActions.SET_USER_PROFILE, profile, callback)
        }
      )

      socket.on(SocketActions.USER_PROFILES_UPDATED, (payload: UserProfilesUpdatedPayload) => {
        this.logger.info(`Emitting ${SocketActions.USER_PROFILES_UPDATED}`)
        this.emit(SocketActions.USER_PROFILES_UPDATED, payload)
      })

      // ====== Local First Auth ======

      socket.on(
        SocketActions.VALIDATE_OR_CREATE_LONG_LIVED_LFA_INVITE,
        async (inviteId: Base58, callback: (response: InviteResultWithSalt | undefined) => void) => {
          this.logger.info(`Validating long lived LFA invite with ID ${inviteId} or creating a new one`)
          this.emit(SocketActions.VALIDATE_OR_CREATE_LONG_LIVED_LFA_INVITE, inviteId, callback)
        }
      )

      socket.on(SocketEvents.CREATED_LONG_LIVED_LFA_INVITE, (invite: InviteResultWithSalt) => {
        this.logger.info(`Created new long lived LFA invite code with id ${invite.id}`)
        this.emit(SocketEvents.CREATED_LONG_LIVED_LFA_INVITE, invite)
      })

      // ====== Misc ======

      socket.on(SocketActions.LOAD_MIGRATION_DATA, async (data: Record<string, any>) => {
        this.emit(SocketActions.LOAD_MIGRATION_DATA, data)
      })

      socket.on(SocketActions.HCAPTCHA_FORM_RESPONSE, async (payload: HCaptchaFormResponse) => {
        this.emit(SocketActions.HCAPTCHA_FORM_RESPONSE, payload)
      })

      socket.on(SocketActions.HCAPTCHA_REQUEST, async () => {
        this.emit(SocketActions.HCAPTCHA_REQUEST)
      })

      socket.on(SocketActions.TOGGLE_P2P, async (enabled: boolean, callback: (response: boolean) => void) => {
        this.emit(SocketActions.TOGGLE_P2P, enabled, callback)
      })

      // ====== Push Notifications ======
      socket.on(
        SocketActions.SEND_DEVICE_TOKEN,
        async (payload: { deviceToken: string; bundleId: string; platform: 'ios' | 'android' }) => {
          this.emit(SocketActions.SEND_DEVICE_TOKEN, payload)
        }
      )
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
    return new Promise((resolve, reject) => {
      this.serverIoProvider.server.getConnections((err, count) => {
        if (err) {
          this.logger.error(`Error occurred while getting connection`, err)
          reject(new Error(`Error occurred while getting connection: ${err.message}`))
          return
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

  public listen = (): Promise<void> => this.openListener(false)

  private async openListener(isRecovery: boolean): Promise<void> {
    this.logger.info(`Opening data server on port ${this.configOptions.socketIOPort}`)

    if (this.serverIoProvider.server.listening) {
      this.logger.warn('Failed to listen. Server already listening.')
      return
    }

    const numConnections = await this.getConnections()

    // A shutdown can finish while getConnections is pending on a closed server.
    // Only recovery is excluded: explicit listen() retains its existing lifecycle.
    if (isRecovery && this.closing) return

    if (numConnections > 0) {
      this.logger.warn('Failed to listen. Connections still open:', numConnections)
      return
    }

    return new Promise((resolve, reject) => {
      const server = this.serverIoProvider.server
      const onError = (error: Error) => {
        server.off('listening', onListening)
        reject(error)
      }
      const onListening = () => {
        server.off('error', onError)
        this.logger.info(`Data server running on port ${this.configOptions.socketIOPort}`)
        resolve()
      }
      server.once('error', onError)
      server.once('listening', onListening)
      try {
        server.listen(this.configOptions.socketIOPort, '127.0.0.1')
      } catch (error) {
        server.off('error', onError)
        onError(error as Error)
      }
    })
  }

  /** Repair the local listener without closing Socket.IO or any community state. */
  public recoverLocalConnection(): Promise<void> {
    if (this.closing) return Promise.resolve()
    if (this.recoveryInFlight) return this.recoveryInFlight
    const recovery = this.recoverListener()
    this.recoveryInFlight = recovery
    void recovery
      .finally(() => {
        if (this.recoveryInFlight === recovery) this.recoveryInFlight = undefined
      })
      .catch(() => undefined)
    return recovery
  }

  private async recoverListener(): Promise<void> {
    if (this.serverIoProvider.server.listening && (await this.probeListener())) return
    if (this.closing) return
    this.logger.warn('Reopening unreachable local frontend listener')

    // Do not call io.close(): it removes Engine.IO's request/upgrade handlers.
    // Close only the underlying transports so the existing authenticated server
    // and its event handlers continue accepting connections after listen().
    const closed = new Promise<void>((resolve, reject) => {
      this.serverIoProvider.server.close((error?: Error & { code?: string }) => {
        if (error && error.code !== 'ERR_SERVER_NOT_RUNNING') reject(error)
        else resolve()
      })
    })
    this.sockets.forEach(socket => socket.destroy())
    await closed
    if (!this.closing) await this.openListener(true)
  }

  private probeListener(): Promise<boolean> {
    return new Promise(resolve => {
      const probe = net.createConnection({ host: '127.0.0.1', port: this.configOptions.socketIOPort })
      const finish = (healthy: boolean) => {
        probe.destroy()
        resolve(healthy)
      }
      probe.once('connect', () => finish(true))
      probe.once('error', () => finish(false))
      probe.setTimeout(1000, () => finish(false))
    })
  }

  public close = (): Promise<void> => {
    this.closing = true
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
