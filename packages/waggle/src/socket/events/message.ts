import { EventTypesServer } from '../constants'

export const message = (socket, message) => {
  socket.emit(EventTypesServer.MESSAGE, message)
}

export const directMessage = (socket, message) => {
  socket.emit(EventTypesServer.DIRECT_MESSAGE, message)
}
