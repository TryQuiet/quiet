import { EventTypesServer } from '../constants'
import { EventTypesResponse } from '../constantsReponse'
import { Git } from '../../git/'
import { ConnectionsManager } from '../../libp2p/connectionsManager'
import { Tor } from 'tor-manager'

module.exports = (io, connectionsManager: ConnectionsManager, git: Git, tor: Tor) => {
  io.on(EventTypesServer.CONNECTION, (socket) => {
    socket.on(EventTypesServer.SUBSCRIBE_FOR_TOPIC, async (channelAddress: string) => {
      await git.createRepository(channelAddress)
      await connectionsManager.subscribeForTopic({ channelAddress, git, io })
    })
    socket.on(EventTypesServer.SEND_MESSAGE, async ({ channelAddress, message }) => {
      console.log(channelAddress, message)
      await git.createRepository(channelAddress)
      await connectionsManager.sendMessage(channelAddress, git, message)
    })
    socket.on(EventTypesServer.FETCH_ALL_MESSAGES, async (channelAddress: string) => {
      try {
        await git.createRepository(channelAddress)
        const orderedMessages = await git.loadAllMessages(channelAddress)
        socket.emit(EventTypesResponse.RESPONSE_FETCH_ALL_MESSAGES, orderedMessages)
      } catch (err) {
        console.error(err)
        socket.emit(EventTypesServer.ERROR, {
          type: EventTypesServer.FETCH_ALL_MESSAGES,
          err
        })
      }
    })
    socket.on(EventTypesServer.ADD_TOR_SERVICE, async (port: number) => {
      try {
        const service = await tor.addService({ port })
        socket.emit(EventTypesResponse.RESPONSE_ADD_TOR_SERVICE, service)
      } catch (err) {
        console.error(err)
        socket.emit(EventTypesServer.ERROR, {
          type: EventTypesServer.ADD_TOR_SERVICE,
          err
        })
      }
    })
    socket.on(EventTypesServer.REMOVE_TOR_SERVICE, async (port: number) => {
      try {
        await tor.killService({ port })
        socket.emit(EventTypesResponse.RESPONSE_REMOVE_TOR_SERVICE, { port })
      } catch (err) {
        console.error(err)
        socket.emit(EventTypesServer.ERROR, {
          type: EventTypesServer.REMOVE_TOR_SERVICE,
          err
        })
      }
    })
  })
}
