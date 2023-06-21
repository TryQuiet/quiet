import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { SocketActionTypes, CreateChannelPayload, SendMessagePayload, UploadFilePayload, DownloadFilePayload, CancelDownloadPayload, AskForMessagesPayload, RegisterUserCertificatePayload, ConnectionProcessInfo, RegisterOwnerCertificatePayload, SaveOwnerCertificatePayload, InitCommunityPayload, LaunchRegistrarPayload, Community, DeleteFilesFromChannelSocketPayload } from '@quiet/types'
import cors, { CorsOptions } from 'cors'
import EventEmitter from 'events'
import { CONFIG_OPTIONS, SERVER_IO_PROVIDER } from '../const'
import { ConfigOptions, ServerIoProviderTypes } from '../types'

@Injectable()
export class SocketService extends EventEmitter implements OnModuleInit {
    private readonly logger = new Logger(SocketService.name)
    constructor(@Inject(SERVER_IO_PROVIDER) public readonly serverIoProvider: ServerIoProviderTypes,
    @Inject(CONFIG_OPTIONS) public readonly configOptions: ConfigOptions) {
      super()
    }

   async onModuleInit() {
    this.logger.log('init:started')
    this.initSocket()

    const connection = new Promise<void>((resolve) => {
        this.serverIoProvider.io.on(SocketActionTypes.CONNECTION, socket => {
        this.logger.log('init: connection')
        resolve()
      })
    })
    await this.listen()

    await connection
    this.logger.log('init:finished')
  }

    private readonly initSocket = (): void => {
      // Attach listeners here
      this.serverIoProvider.io.on(SocketActionTypes.CONNECTION, socket => {
        this.logger.log('socket connection')
        // On websocket connection, update presentation service with network data
        this.emit(SocketActionTypes.CONNECTION)
        socket.on(SocketActionTypes.CLOSE, async () => {
          this.emit(SocketActionTypes.CLOSE)
        })
        socket.on(SocketActionTypes.CREATE_CHANNEL, async (payload: CreateChannelPayload) => {
          this.emit(SocketActionTypes.CREATE_CHANNEL, payload)
        })
        socket.on(
          SocketActionTypes.SEND_MESSAGE,
          async (payload: SendMessagePayload) => {
            this.emit(SocketActionTypes.SEND_MESSAGE, payload)
          }
        )
        socket.on(
          SocketActionTypes.UPLOAD_FILE,
          async (payload: UploadFilePayload) => {
            this.emit(SocketActionTypes.UPLOAD_FILE, payload.file)
          }
        )
        socket.on(
          SocketActionTypes.DOWNLOAD_FILE,
          async (payload: DownloadFilePayload) => {
            this.emit(SocketActionTypes.DOWNLOAD_FILE, payload.metadata)
          }
        )
        socket.on(
          SocketActionTypes.CANCEL_DOWNLOAD,
          async (payload: CancelDownloadPayload) => {
            this.emit(SocketActionTypes.CANCEL_DOWNLOAD, payload.mid)
          }
        )
        socket.on(
          SocketActionTypes.INITIALIZE_CONVERSATION,
          async (
            peerId: string,
            { address, encryptedPhrase }: { address: string; encryptedPhrase: string }
          ) => {
            this.emit(SocketActionTypes.INITIALIZE_CONVERSATION, { address, encryptedPhrase })
          }
        )
        socket.on(SocketActionTypes.GET_PRIVATE_CONVERSATIONS, async (peerId: string) => {
          this.emit(SocketActionTypes.GET_PRIVATE_CONVERSATIONS, { peerId })
        })
        socket.on(
          SocketActionTypes.SEND_DIRECT_MESSAGE,
          async (
            peerId: string,
            { channelId, message }: { channelId: string; message: string }
          ) => {
            this.emit(SocketActionTypes.SEND_DIRECT_MESSAGE, { channelId, message })
          }
        )
        socket.on(
          SocketActionTypes.SUBSCRIBE_FOR_DIRECT_MESSAGE_THREAD,
          async (peerId: string, channelId: string) => {
            this.emit(SocketActionTypes.SUBSCRIBE_FOR_DIRECT_MESSAGE_THREAD, { peerId, channelId })
          }
        )
        socket.on(
          SocketActionTypes.SUBSCRIBE_FOR_ALL_CONVERSATIONS,
          async (peerId: string, conversations: string[]) => {
            this.emit(SocketActionTypes.SUBSCRIBE_FOR_ALL_CONVERSATIONS, { peerId, conversations })
          }
        )
        socket.on(SocketActionTypes.ASK_FOR_MESSAGES, async (payload: AskForMessagesPayload) => {
          this.emit(SocketActionTypes.ASK_FOR_MESSAGES, payload)
        })

        socket.on(
          SocketActionTypes.REGISTER_USER_CERTIFICATE,
          async (payload: RegisterUserCertificatePayload) => {
            this.logger.log(`Registering user certificate (${payload.communityId}) on ${payload.serviceAddress}`)
            this.emit(SocketActionTypes.REGISTER_USER_CERTIFICATE, payload)
            await new Promise<void>(resolve => setTimeout(() => resolve(), 2000))
            this.emit(SocketActionTypes.CONNECTION_PROCESS_INFO, ConnectionProcessInfo.REGISTERING_USER_CERTIFICATE)
          }
        )
        socket.on(
          SocketActionTypes.REGISTER_OWNER_CERTIFICATE,
          async (payload: RegisterOwnerCertificatePayload) => {
            this.logger.log(`Registering owner certificate (${payload.communityId})`)
            this.emit(SocketActionTypes.REGISTER_OWNER_CERTIFICATE, payload)
            this.emit(SocketActionTypes.CONNECTION_PROCESS_INFO, ConnectionProcessInfo.REGISTERING_OWNER_CERTIFICATE)
          }
        )
        socket.on(
          SocketActionTypes.SAVE_OWNER_CERTIFICATE,
          async (payload: SaveOwnerCertificatePayload) => {
            this.logger.log(`Saving owner certificate (${payload.peerId}), community: ${payload.id}`)
            this.emit(SocketActionTypes.SAVED_OWNER_CERTIFICATE, payload)
          }
        )
        socket.on(SocketActionTypes.CREATE_COMMUNITY, async (payload: InitCommunityPayload) => {
          this.logger.log(`Creating community ${payload.id}`)
          this.emit(SocketActionTypes.CREATE_COMMUNITY, payload)
        })
        socket.on(SocketActionTypes.LAUNCH_COMMUNITY, async (payload: InitCommunityPayload) => {
          this.logger.log(`Launching community ${payload.id} for ${payload.peerId.id}`)
          this.emit(SocketActionTypes.LAUNCH_COMMUNITY, payload)
          this.emit(SocketActionTypes.CONNECTION_PROCESS_INFO, ConnectionProcessInfo.LAUNCHING_COMMUNITY)
        })
        socket.on(SocketActionTypes.LAUNCH_REGISTRAR, async (payload: LaunchRegistrarPayload) => {
          this.logger.log(`Launching registrar for community ${payload.id}, user ${payload.peerId}`)
          this.emit(SocketActionTypes.LAUNCH_REGISTRAR, payload)
        })
        socket.on(SocketActionTypes.CREATE_NETWORK, async (community: Community) => {
          this.logger.log(`Creating network for community ${community.id}`)
          this.emit(SocketActionTypes.CREATE_NETWORK, community)
        })
        socket.on(SocketActionTypes.LEAVE_COMMUNITY, async () => {
          this.logger.log('leaving community')
          this.emit(SocketActionTypes.LEAVE_COMMUNITY)
        })
        socket.on(SocketActionTypes.DELETE_CHANNEL, async (payload: {channelId: string; ownerPeerId: string}) => {
          this.logger.log('deleting channel ', payload.channelId)
          this.emit(SocketActionTypes.DELETE_CHANNEL, payload)
        })
        socket.on(SocketActionTypes.DELETE_FILES_FROM_CHANNEL, async (payload: DeleteFilesFromChannelSocketPayload) => {
          this.logger.log('DELETE_FILES_FROM_CHANNEL', payload)
          this.emit(SocketActionTypes.DELETE_FILES_FROM_CHANNEL, payload)
        })
      })
    }

    public listen = async (): Promise<void> => {
      return await new Promise(resolve => {
        if (this.serverIoProvider.server.listening) resolve()
        this.serverIoProvider.server.listen(this.configOptions.socketIOPort, () => {
          this.logger.log(`Data server running on port ${this.configOptions.socketIOPort}`)
          resolve()
        })
      })
    }

    public close = async (): Promise<void> => {
      this.logger.log(`Closing data server on port ${this.configOptions.socketIOPort}`)
      return await new Promise(resolve => {
        this.serverIoProvider.server.close((err) => {
          if (err) throw new Error(err.message)
          resolve()
        })
      })
    }
  }
