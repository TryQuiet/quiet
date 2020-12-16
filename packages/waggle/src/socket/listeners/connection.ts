import { EventTypesServer } from '../constants'
import { event } from '../events/connected'
import { Git } from '../../../git/index'

module.exports = (io, connectionsManager, git: Git) => {
  io.on(EventTypesServer.CONNECTION, async (socket) => {
    const messages = await git.loadAllMessages('test-address')
    socket.emit(EventTypesServer.FETCH_ALL_MESSAGES, messages)
    socket.on(EventTypesServer.SEND_MESSAGE, ({ message }) => {
      console.log('working here')
      console.log('test, message', message)
      connectionsManager.sendMessage('test-address', git, message)
    })
  })
}