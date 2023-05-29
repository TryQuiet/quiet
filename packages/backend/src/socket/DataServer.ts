import express from 'express'
import { createServer, Server } from 'http'
import { Server as SocketIO } from 'socket.io'
import logger from '../logger'
import { EventEmitter } from 'events'
import cors from 'cors'
import type { CorsOptions } from 'cors'
import { AskForMessagesPayload, CancelDownloadPayload, Community, ConnectionProcessInfo, CreateChannelPayload, DeleteFilesFromChannelSocketPayload, DownloadFilePayload, InitCommunityPayload, LaunchRegistrarPayload, RegisterOwnerCertificatePayload, RegisterUserCertificatePayload, SaveOwnerCertificatePayload, SendMessagePayload, SocketActionTypes, UploadFilePayload } from '@quiet/types'

const log = logger('socket')

export class DataServer extends EventEmitter {
  public PORT: number
  private readonly _app: express.Application
  private readonly server: Server
  public io: SocketIO
  constructor(port: number) {
    super()
    this.PORT = port
    this._app = express()
    this._app.use(cors())
    this.server = createServer(this._app)
    this.initSocket()
  }

  private get cors(): CorsOptions { // TODO: is this still necessary?
    if (process.env.TEST_MODE === 'true' && process.env.E2E_TEST === 'true') {
      log('Development/test env. Getting cors')
      return {
        origin: '*',
        methods: ['GET', 'POST']
      }
    }
    return {}
  }

  private readonly initSocket = (): void => {
    this.io = new SocketIO(this.server, {
      cors: this.cors,
      pingInterval: 1000_000,
      pingTimeout: 1000_000
    })
    // Attach listeners here
    this.io.on(SocketActionTypes.CONNECTION, socket => {
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
          log(`Registering user certificate (${payload.communityId}) on ${payload.serviceAddress}`)
          this.emit(SocketActionTypes.REGISTER_USER_CERTIFICATE, payload)
          await new Promise<void>(resolve => setTimeout(() => resolve(), 2000))
          this.emit(SocketActionTypes.CONNECTION_PROCESS_INFO, ConnectionProcessInfo.REGISTERING_USER_CERTIFICATE)
        }
      )
      socket.on(
        SocketActionTypes.REGISTER_OWNER_CERTIFICATE,
        async (payload: RegisterOwnerCertificatePayload) => {
          log(`Registering owner certificate (${payload.communityId})`)
          this.emit(SocketActionTypes.REGISTER_OWNER_CERTIFICATE, payload)
          this.emit(SocketActionTypes.CONNECTION_PROCESS_INFO, ConnectionProcessInfo.REGISTERING_OWNER_CERTIFICATE)
        }
      )
      socket.on(
        SocketActionTypes.SAVE_OWNER_CERTIFICATE,
        async (payload: SaveOwnerCertificatePayload) => {
          log(`Saving owner certificate (${payload.peerId}), community: ${payload.id}`)
          this.emit(SocketActionTypes.SAVED_OWNER_CERTIFICATE, payload)
        }
      )
      socket.on(SocketActionTypes.CREATE_COMMUNITY, async (payload: InitCommunityPayload) => {
        log(`Creating community ${payload.id}`)
        this.emit(SocketActionTypes.CREATE_COMMUNITY, payload)
      })
      socket.on(SocketActionTypes.LAUNCH_COMMUNITY, async (payload: InitCommunityPayload) => {
        log(`Launching community ${payload.id} for ${payload.peerId.id}`)
        this.emit(SocketActionTypes.LAUNCH_COMMUNITY, payload)
        this.emit(SocketActionTypes.CONNECTION_PROCESS_INFO, ConnectionProcessInfo.LAUNCHING_COMMUNITY)
      })
      socket.on(SocketActionTypes.LAUNCH_REGISTRAR, async (payload: LaunchRegistrarPayload) => {
        log(`Launching registrar for community ${payload.id}, user ${payload.peerId}`)
        this.emit(SocketActionTypes.LAUNCH_REGISTRAR, payload)
      })
      socket.on(SocketActionTypes.CREATE_NETWORK, async (community: Community) => {
        log(`Creating network for community ${community.id}`)
        this.emit(SocketActionTypes.CREATE_NETWORK, community)
      })
      socket.on(SocketActionTypes.LEAVE_COMMUNITY, async () => {
        log('leaving community')
        this.emit(SocketActionTypes.LEAVE_COMMUNITY)
      })
      socket.on(SocketActionTypes.DELETE_CHANNEL, async (payload: {channelId: string; ownerPeerId: string}) => {
        log('deleting channel ', payload.channelId)
        this.emit(SocketActionTypes.DELETE_CHANNEL, payload)
      })
      socket.on(SocketActionTypes.DELETE_FILES_FROM_CHANNEL, async (payload: DeleteFilesFromChannelSocketPayload) => {
        log('DELETE_FILES_FROM_CHANNEL', payload)
        this.emit(SocketActionTypes.DELETE_FILES_FROM_CHANNEL, payload)
      })
    })
  }

  public listen = async (): Promise<void> => {
    return await new Promise(resolve => {
      if (this.server.listening) resolve()
      this.server.listen(this.PORT, () => {
        log(`Data server running on port ${this.PORT}`)
        resolve()
      })
    })
  }

  public close = async (): Promise<void> => {
    log(`Closing data server on port ${this.PORT}`)
    return await new Promise(resolve => {
      this.server.close((err) => {
        if (err) throw new Error(err.message)
        resolve()
      })
    })
  }
}
