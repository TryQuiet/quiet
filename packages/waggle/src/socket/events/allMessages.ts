import { EventTypesServer } from '../constants'

export const loadAllMessages = (socket, messages) => {
  socket.emit(EventTypesServer.FETCH_ALL_MESSAGES, messages)
}