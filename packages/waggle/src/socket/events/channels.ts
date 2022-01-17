import SocketIO from 'socket.io'
import { SocketActionTypes } from '@zbayapp/nectar'
import { IChannelInfo } from '../../common/types'

export const createdChannel = (
  socket: SocketIO.Server,
  channel: IChannelInfo,
  communityId: string
) => {
  console.log(`Created channel ${channel.address}`)
  socket.emit(SocketActionTypes.CREATED_CHANNEL, { channel, communityId })
}
