import SocketIO from 'socket.io'
import { PublicChannel, SocketActionTypes } from '@zbayapp/nectar'

export const createdChannel = (
  socket: SocketIO.Server,
  channel: PublicChannel,
  communityId: string
) => {
  console.log(`Created channel ${channel.address}`)
  socket.emit(SocketActionTypes.CREATED_CHANNEL, { channel, communityId })
}
