import { EventTypesServer } from '../constants'

export const message = (socket, message) => {
  socket.emit(EventTypesServer.MESSAGE, message)
}