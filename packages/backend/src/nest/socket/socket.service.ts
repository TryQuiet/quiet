import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import {
  SocketActionTypes,
  CreateChannelPayload,
  SendMessagePayload,
  UploadFilePayload,
  DownloadFilePayload,
  CancelDownloadPayload,
  AskForMessagesPayload,
  ConnectionProcessInfo,
  RegisterOwnerCertificatePayload,
  SaveOwnerCertificatePayload,
  InitCommunityPayload,
  LaunchRegistrarPayload,
  Community,
  DeleteFilesFromChannelSocketPayload,
  SaveCSRPayload,
  CommunityMetadata,
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
      socket.on(SocketActionTypes.CREATE_CHANNEL, async (payload: CreateChannelPayload) => {
        this.emit(SocketActionTypes.CREATE_CHANNEL, payload)
      })

      socket.on(SocketActionTypes.DELETE_CHANNEL, async (payload: { channelId: string; ownerPeerId: string }) => {
        this.emit(SocketActionTypes.DELETE_CHANNEL, payload)
      })

      // ====== Messages ======
      socket.on(SocketActionTypes.SEND_MESSAGE, async (payload: SendMessagePayload) => {
        this.emit(SocketActionTypes.SEND_MESSAGE, payload)
      })

      socket.on(SocketActionTypes.SUBSCRIBE_FOR_ALL_CONVERSATIONS, async (peerId: string, conversations: string[]) => {
        this.emit(SocketActionTypes.SUBSCRIBE_FOR_ALL_CONVERSATIONS, { peerId, conversations })
      })

      socket.on(SocketActionTypes.ASK_FOR_MESSAGES, async (payload: AskForMessagesPayload) => {
        this.emit(SocketActionTypes.ASK_FOR_MESSAGES, payload)
      })

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

      // ====== Direct Messages ======
      socket.on(
        SocketActionTypes.INITIALIZE_CONVERSATION,
        async (peerId: string, { address, encryptedPhrase }: { address: string; encryptedPhrase: string }) => {
          this.emit(SocketActionTypes.INITIALIZE_CONVERSATION, { address, encryptedPhrase })
        }
      )

      socket.on(SocketActionTypes.GET_PRIVATE_CONVERSATIONS, async (peerId: string) => {
        this.emit(SocketActionTypes.GET_PRIVATE_CONVERSATIONS, { peerId })
      })

      socket.on(
        SocketActionTypes.SEND_DIRECT_MESSAGE,
        async (peerId: string, { channelId, message }: { channelId: string; message: string }) => {
          this.emit(SocketActionTypes.SEND_DIRECT_MESSAGE, { channelId, message })
        }
      )

      socket.on(SocketActionTypes.SUBSCRIBE_FOR_DIRECT_MESSAGE_THREAD, async (peerId: string, channelId: string) => {
        this.emit(SocketActionTypes.SUBSCRIBE_FOR_DIRECT_MESSAGE_THREAD, { peerId, channelId })
      })

      // ====== Certificates ======
      socket.on(SocketActionTypes.SAVE_USER_CSR, async (payload: SaveCSRPayload) => {
        this.logger(`On ${SocketActionTypes.SAVE_USER_CSR}`)

        this.emit(SocketActionTypes.SAVE_USER_CSR, payload)

        await new Promise<void>(resolve => setTimeout(() => resolve(), 2000))

        this.emit(SocketActionTypes.CONNECTION_PROCESS_INFO, ConnectionProcessInfo.WAITING_FOR_METADATA)
      })

      socket.on(SocketActionTypes.REGISTER_OWNER_CERTIFICATE, async (payload: RegisterOwnerCertificatePayload) => {
        this.logger(`Registering owner certificate (${payload.communityId})`)

        this.emit(SocketActionTypes.REGISTER_OWNER_CERTIFICATE, payload)
        this.emit(SocketActionTypes.CONNECTION_PROCESS_INFO, ConnectionProcessInfo.REGISTERING_OWNER_CERTIFICATE)
      })

      socket.on(SocketActionTypes.SAVE_OWNER_CERTIFICATE, async (payload: SaveOwnerCertificatePayload) => {
        this.logger(`Saving owner certificate (${payload.peerId}), community: ${payload.id}`)

        this.emit(SocketActionTypes.SAVED_OWNER_CERTIFICATE, payload)

        const communityMetadataPayload: CommunityMetadata = {
          id: payload.id,
          ownerCertificate: payload.certificate,
          rootCa: payload.permsData.certificate,
        }

        console.log('Metadata from state-manager', communityMetadataPayload)

        this.emit(SocketActionTypes.SEND_COMMUNITY_METADATA, communityMetadataPayload)
      })

      // ====== Community ======
      socket.on(SocketActionTypes.SEND_COMMUNITY_METADATA, (payload: CommunityMetadata) => {
        this.emit(SocketActionTypes.SEND_COMMUNITY_METADATA, payload)
      })

      socket.on(SocketActionTypes.CREATE_COMMUNITY, async (payload: InitCommunityPayload) => {
        this.logger(`Creating community ${payload.id}`)
        this.emit(SocketActionTypes.CREATE_COMMUNITY, payload)
      })

      socket.on(SocketActionTypes.LAUNCH_COMMUNITY, async (payload: InitCommunityPayload) => {
        this.logger(`Launching community ${payload.id} for ${payload.peerId.id}`)
        this.emit(SocketActionTypes.LAUNCH_COMMUNITY, payload)
        this.emit(SocketActionTypes.CONNECTION_PROCESS_INFO, ConnectionProcessInfo.LAUNCHING_COMMUNITY)
      })

      socket.on(SocketActionTypes.LAUNCH_REGISTRAR, async (payload: LaunchRegistrarPayload) => {
        this.logger(`Launching registrar for community ${payload.id}, user ${payload.peerId}`)
        this.emit(SocketActionTypes.LAUNCH_REGISTRAR, payload)
      })

      socket.on(SocketActionTypes.CREATE_NETWORK, async (community: Community) => {
        this.logger(`Creating network for community ${community.id}`)
        this.emit(SocketActionTypes.CREATE_NETWORK, community)
      })

      socket.on(SocketActionTypes.LEAVE_COMMUNITY, async () => {
        this.logger('Leaving community')
        this.emit(SocketActionTypes.LEAVE_COMMUNITY)
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
