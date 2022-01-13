import { IChannelInfo } from '../../common/types'
import { EventTypesServer } from '../constants'
import SocketIO from 'socket.io'

export const createdChannel = (
  socket: SocketIO.Server,
  channel: IChannelInfo,
  communityId: string
) => {
  console.log(`Created channel ${channel.address}`)
  socket.emit(EventTypesServer.CREATED_CHANNEL, { channel, communityId })
}
