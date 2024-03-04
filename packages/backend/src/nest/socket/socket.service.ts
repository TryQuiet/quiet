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

@Injectable()
export class SocketService extends EventEmitter implements OnModuleInit {
  private readonly logger = Logger(SocketService.name)

  public resolveReadyness: (value: void | PromiseLike<void>) => void
  public readyness: Promise<void>

  constructor(
    @Inject(SERVER_IO_PROVIDER) public readonly serverIoProvider: ServerIoProviderTypes,
    @Inject(CONFIG_OPTIONS) public readonly configOptions: ConfigOptions
  ) {
    super()

    this.readyness = new Promise<void>(resolve => {
      this.resolveReadyness = resolve
    })
  }

  async onModuleInit() {
    this.logger('init:started')

    this.attachListeners()
    await this.init()

    this.logger('init:finished')
  }

  public async init() {
    const connection = new Promise<void>(resolve => {
      this.serverIoProvider.io.on(SocketActionTypes.CONNECTION, socket => {
        this.logger('init: connection')
        resolve()
      })
    })

    await this.listen()

    await connection
  }

  private readonly attachListeners = (): void => {
    // Attach listeners here
    this.serverIoProvider.io.on(SocketActionTypes.CONNECTION, socket => {
      this.logger('socket connection')

      // On websocket connection, update presentation service with network data
      this.emit(SocketActionTypes.CONNECTION)

      socket.on(SocketActionTypes.CLOSE, async () => {
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

      socket.on(SocketActionTypes.REGISTER_OWNER_CERTIFICATE, async (payload: RegisterOwnerCertificatePayload) => {
        this.logger(`Registering owner certificate (${payload.communityId})`)

        this.emit(SocketActionTypes.REGISTER_OWNER_CERTIFICATE, payload)
        this.emit(SocketActionTypes.CONNECTION_PROCESS_INFO, ConnectionProcessInfo.REGISTERING_OWNER_CERTIFICATE)
      })

      // ====== Community ======
      socket.on(
        SocketActionTypes.CREATE_COMMUNITY,
        async (payload: InitCommunityPayload, callback: (response: Community) => void) => {
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

      socket.on(SocketActionTypes.LEAVE_COMMUNITY, async () => {
        this.logger('Leaving community')
        this.emit(SocketActionTypes.LEAVE_COMMUNITY)
      })

      socket.on(SocketActionTypes.LIBP2P_PSK_STORED, payload => {
        this.logger('Saving PSK', payload)
        this.emit(SocketActionTypes.LIBP2P_PSK_STORED, payload)
      })

      socket.on(
        SocketActionTypes.SET_COMMUNITY_METADATA,
        (payload: CommunityMetadata, callback: (response?: CommunityMetadata) => void) => {
          this.emit(SocketActionTypes.SET_COMMUNITY_METADATA, payload, callback)
        }
      )

      socket.on(SocketActionTypes.SET_COMMUNITY_CA_DATA, (payload: PermsData) => {
        this.emit(SocketActionTypes.SET_COMMUNITY_CA_DATA, payload)
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
  }

  public listen = async (port = this.configOptions.socketIOPort): Promise<void> => {
    return await new Promise(resolve => {
      if (this.serverIoProvider.server.listening) resolve()
      this.serverIoProvider.server.listen(this.configOptions.socketIOPort, '127.0.0.1', () => {
        this.logger(`Data server running on port ${this.configOptions.socketIOPort}`)
        resolve()
      })
    })
  }

  public close = async (): Promise<void> => {
    this.logger(`Closing data server on port ${this.configOptions.socketIOPort}`)
    return await new Promise(resolve => {
      this.serverIoProvider.server.close(err => {
        if (err) throw new Error(err.message)
        resolve()
      })
    })
  }
}
