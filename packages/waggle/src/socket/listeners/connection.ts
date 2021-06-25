import { EventTypesServer } from '../constants'
import { ConnectionsManager } from '../../libp2p/connectionsManager'
import { IChannelInfo, IMessage } from '../../storage/storage'

export const connections = (io, connectionsManager: ConnectionsManager) => {
  io.on(EventTypesServer.CONNECTION, socket => {
    console.log('websocket connected')
    socket.on(EventTypesServer.SUBSCRIBE_FOR_TOPIC, async (channelData: IChannelInfo) => {
      await connectionsManager.subscribeForTopic(channelData)
    })
    socket.on(
      EventTypesServer.SEND_MESSAGE,
      async ({ channelAddress, message }: { channelAddress: string, message: IMessage }) => {
        await connectionsManager.sendMessage(channelAddress, message)
      }
    )
    socket.on(EventTypesServer.GET_PUBLIC_CHANNELS, async () => {
      await connectionsManager.updateChannels()
    })
    socket.on(EventTypesServer.FETCH_ALL_MESSAGES, async (channelAddress: string) => {
      await connectionsManager.loadAllMessages(channelAddress)
    })
    socket.on(
      EventTypesServer.ADD_USER,
      async ({ publicKey, halfKey }: { publicKey: string, halfKey: string }) => {
        await connectionsManager.addUser(publicKey, halfKey)
      }
    )
    socket.on(EventTypesServer.GET_AVAILABLE_USERS, async () => {
      await connectionsManager.getAvailableUsers()
    })
    socket.on(
      EventTypesServer.INITIALIZE_CONVERSATION,
      async ({ address, encryptedPhrase }: { address: string, encryptedPhrase: string }) => {
        await connectionsManager.initializeConversation(address, encryptedPhrase)
      }
    )
    socket.on(EventTypesServer.GET_PRIVATE_CONVERSATIONS, async () => {
      await connectionsManager.getPrivateConversations()
    })
    socket.on(
      EventTypesServer.SEND_DIRECT_MESSAGE,
      async ({ channelAddress, message }: { channelAddress: string, message: string }) => {
        await connectionsManager.sendDirectMessage(channelAddress, message)
      }
    )
    socket.on(
      EventTypesServer.SUBSCRIBE_FOR_DIRECT_MESSAGE_THREAD,
      async (channelAddress: string) => {
        await connectionsManager.subscribeForDirectMessageThread(channelAddress)
      }
    )
    socket.on(EventTypesServer.SUBSCRIBE_FOR_ALL_CONVERSATIONS, async (conversations: string[]) => {
      await connectionsManager.subscribeForAllConversations(conversations)
    })
    socket.on(
      EventTypesServer.ASK_FOR_MESSAGES,
      async ({ channelAddress, ids }: { channelAddress: string, ids: string[] }) => {
        await connectionsManager.askForMessages(channelAddress, ids)
      }
    )
    socket.on(EventTypesServer.SAVE_CERTIFICATE, async (certificate: string) => {
      console.log('Received saveCertificate websocket event, processing.')
      await connectionsManager.saveCertificate(certificate)
    })
  })
}
