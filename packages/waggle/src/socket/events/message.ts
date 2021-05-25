import { EventTypesServer } from '../constants'

export const message = (socket, message) => {
  socket.emit(EventTypesServer.MESSAGE, message)
}

export const directMessage = (socket, message) => {
  console.log('emitting direct message to zbaylite')
  socket.emit(EventTypesServer.DIRECT_MESSAGE, message)
}
