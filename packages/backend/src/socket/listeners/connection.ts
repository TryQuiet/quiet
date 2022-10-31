import {
  Community,
  InitCommunityPayload,
  LaunchRegistrarPayload,
  RegisterOwnerCertificatePayload,
  RegisterUserCertificatePayload,
  SaveOwnerCertificatePayload,
  SendMessagePayload,
  SocketActionTypes,
  SubscribeToTopicPayload,
  AskForMessagesPayload,
  UploadFilePayload,
  DownloadFilePayload,
  CancelDownloadPayload,
  NetworkDataPayload,
} from '@quiet/state-manager'

import IOProxy from '../IOProxy'

import logger from '../../logger'

const log = logger('socket')

export const connections = (io, ioProxy: IOProxy) => {
  io.on(SocketActionTypes.CONNECTION, socket => {
    ioProxy.connectionsManager.on(SocketActionTypes.PEER_CONNECTED, (payload: {peer: string}) => {
      console.log('PEER_CONNECT')
      socket.emit(SocketActionTypes.PEER_CONNECTED, payload)
    })
    ioProxy.connectionsManager.on(SocketActionTypes.PEER_DISCONNECTED, (payload: NetworkDataPayload) => {
      socket.emit(SocketActionTypes.PEER_DISCONNECTED, payload)
    })
    socket.on(SocketActionTypes.CLOSE, async () => {
      await ioProxy.closeAll()
    })
    socket.on(SocketActionTypes.SUBSCRIBE_TO_TOPIC, async (payload: SubscribeToTopicPayload) => {
      await ioProxy.subscribeToTopic(payload)
    })
    socket.on(
      SocketActionTypes.SEND_MESSAGE,
      async (payload: SendMessagePayload) => {
        await ioProxy.sendMessage(payload.peerId, payload.message)
      }
    )
    socket.on(
      SocketActionTypes.UPLOAD_FILE,
      async (payload: UploadFilePayload) => {
        await ioProxy.uploadFile(payload.peerId, payload.file)
      }
    )
    socket.on(
      SocketActionTypes.DOWNLOAD_FILE,
      async (payload: DownloadFilePayload) => {
        await ioProxy.downloadFile(payload.peerId, payload.metadata)
      }
    )
    socket.on(
      SocketActionTypes.CANCEL_DOWNLOAD,
      async (payload: CancelDownloadPayload) => {
        await ioProxy.cancelDownload(payload.peerId, payload.mid)
      }
    )
    socket.on(
      SocketActionTypes.INITIALIZE_CONVERSATION,
      async (
        peerId: string,
        { address, encryptedPhrase }: { address: string; encryptedPhrase: string }
      ) => {
        await ioProxy.initializeConversation(peerId, address, encryptedPhrase)
      }
    )
    socket.on(SocketActionTypes.GET_PRIVATE_CONVERSATIONS, async (peerId: string) => {
      await ioProxy.getPrivateConversations(peerId)
    })
    socket.on(
      SocketActionTypes.SEND_DIRECT_MESSAGE,
      async (
        peerId: string,
        { channelAddress, message }: { channelAddress: string; message: string }
      ) => {
        await ioProxy.sendDirectMessage(peerId, channelAddress, message)
      }
    )
    socket.on(
      SocketActionTypes.SUBSCRIBE_FOR_DIRECT_MESSAGE_THREAD,
      async (peerId: string, channelAddress: string) => {
        await ioProxy.subscribeToDirectMessageThread(peerId, channelAddress)
      }
    )
    socket.on(
      SocketActionTypes.SUBSCRIBE_FOR_ALL_CONVERSATIONS,
      async (peerId: string, conversations: string[]) => {
        await ioProxy.subscribeToAllConversations(peerId, conversations)
      }
    )
    socket.on(SocketActionTypes.ASK_FOR_MESSAGES, async (payload: AskForMessagesPayload) => {
      await ioProxy.askForMessages(payload)
    })
    socket.on(
      SocketActionTypes.REGISTER_USER_CERTIFICATE,
      async (payload: RegisterUserCertificatePayload) => {
        log(`Registering user certificate (${payload.communityId}) on ${payload.serviceAddress}`)
        await ioProxy.registerUserCertificate(payload)
      }
    )
    socket.on(
      SocketActionTypes.REGISTER_OWNER_CERTIFICATE,
      async (payload: RegisterOwnerCertificatePayload) => {
        log(`Registering owner certificate (${payload.communityId})`)
        await ioProxy.registerOwnerCertificate(payload)
      }
    )
    socket.on(
      SocketActionTypes.SAVE_OWNER_CERTIFICATE,
      async (payload: SaveOwnerCertificatePayload) => {
        log(`Saving owner certificate (${payload.peerId}), community: ${payload.id}`)
        await ioProxy.saveOwnerCertificate(payload)
      }
    )
    socket.on(SocketActionTypes.CREATE_COMMUNITY, async (payload: InitCommunityPayload) => {
      log(`Creating community ${payload.id}`)
      await ioProxy.createCommunity(payload)
    })
    socket.on(SocketActionTypes.LAUNCH_COMMUNITY, async (payload: InitCommunityPayload) => {
      log(`Launching community ${payload.id} for ${payload.peerId.id}`)
      await ioProxy.launchCommunity(payload)
    })
    socket.on(SocketActionTypes.LAUNCH_REGISTRAR, async (payload: LaunchRegistrarPayload) => {
      log(`Launching registrar for community ${payload.id}, user ${payload.peerId}`)
      await ioProxy.launchRegistrar(payload)
    })
    socket.on(SocketActionTypes.CREATE_NETWORK, async (community: Community) => {
      log(`Creating network for community ${community.id}`)
      await ioProxy.createNetwork(community)
    })
  })
}
