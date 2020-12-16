import { EventTypesServer } from '../constants'

export const event = (socket) => {
  socket.emit('teest', 'hello')
}