import { EventTypesServer } from '../constants'
import { CertsData, IChannelInfo, IMessage } from '../../common/types'
import IOProxy from '../IOProxy'
import PeerId from 'peer-id'

export const connections = (io, ioProxy: IOProxy) => {
  io.on(EventTypesServer.CONNECTION, socket => {
    console.log('websocket connected')
    socket.on(EventTypesServer.SUBSCRIBE_FOR_TOPIC, async (peerId: string, channelData: IChannelInfo) => {
      await ioProxy.subscribeForTopic(peerId, channelData)
    })
    socket.on(
      EventTypesServer.SEND_MESSAGE,
      async (peerId: string, { channelAddress, message }: { channelAddress: string, message: IMessage }) => {
        await ioProxy.sendMessage(peerId, channelAddress, message)
      }
    )
    socket.on(EventTypesServer.GET_PUBLIC_CHANNELS, async (peerId: string) => {
      await ioProxy.updateChannels(peerId)
    })
    socket.on(EventTypesServer.FETCH_ALL_MESSAGES, async (peerId: string, channelAddress: string) => {
      await ioProxy.loadAllMessages(peerId, channelAddress)
    })
    socket.on(
      EventTypesServer.ADD_USER,
      async (peerId: string, { publicKey, halfKey }: { publicKey: string, halfKey: string }) => {
        await ioProxy.addUser(peerId, publicKey, halfKey)
      }
    )
    socket.on(EventTypesServer.GET_AVAILABLE_USERS, async (peerId: string) => {
      await ioProxy.getAvailableUsers(peerId)
    })
    socket.on(
      EventTypesServer.INITIALIZE_CONVERSATION,
      async (peerId: string, { address, encryptedPhrase }: { address: string, encryptedPhrase: string }) => {
        await ioProxy.initializeConversation(peerId, address, encryptedPhrase)
      }
    )
    socket.on(EventTypesServer.GET_PRIVATE_CONVERSATIONS, async (peerId: string) => {
      await ioProxy.getPrivateConversations(peerId)
    })
    socket.on(
      EventTypesServer.SEND_DIRECT_MESSAGE,
      async (peerId: string, { channelAddress, message }: { channelAddress: string, message: string }) => {
        await ioProxy.sendDirectMessage(peerId, channelAddress, message)
      }
    )
    socket.on(
      EventTypesServer.SUBSCRIBE_FOR_DIRECT_MESSAGE_THREAD,
      async (peerId: string, channelAddress: string) => {
        await ioProxy.subscribeForDirectMessageThread(peerId, channelAddress)
      }
    )
    socket.on(EventTypesServer.SUBSCRIBE_FOR_ALL_CONVERSATIONS, async (peerId: string, conversations: string[]) => {
      await ioProxy.subscribeForAllConversations(peerId, conversations)
    })
    socket.on(
      EventTypesServer.ASK_FOR_MESSAGES,
      async (peerId: string, { channelAddress, ids }: { channelAddress: string, ids: string[] }) => {
        await ioProxy.askForMessages(peerId, channelAddress, ids)
      }
    )
    socket.on(EventTypesServer.REGISTER_USER_CERTIFICATE, async (serviceAddress: string, userCsr: string, id: string) => {
      await ioProxy.registerUserCertificate(serviceAddress, userCsr, id)
    })
    socket.on(EventTypesServer.SAVE_CERTIFICATE, async (peerId: string, certificate: string) => {
      console.log('Received saveCertificate websocket event, processing.')
      await ioProxy.saveCertificate(peerId, certificate)
    })
    socket.on(EventTypesServer.CREATE_COMMUNITY, async (payload, certs: CertsData) => {
      await ioProxy.createCommunity(payload.id, certs, payload.rootCertString, payload.rootCertKey)
    })

    socket.on(EventTypesServer.LAUNCH_COMMUNITY, async (id: string, peerId: PeerId.JSONPeerId, hiddenServiceKey: {address: string, privateKey: string}, peers: string[], certs: CertsData) => {
      await ioProxy.launchCommunity(id, peerId, hiddenServiceKey, peers, certs)
    })
    socket.on(EventTypesServer.LAUNCH_REGISTRAR, async (id: string, peerId: string, rootCertString: string, rootKeyString: string, hiddenServicePrivKey?: string, port?: number) => {
      await ioProxy.launchRegistrar(id, peerId, rootCertString, rootKeyString, hiddenServicePrivKey, port)
    })
  })
}
