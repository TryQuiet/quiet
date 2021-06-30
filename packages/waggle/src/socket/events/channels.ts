import { ChannelInfoResponse } from '../../common/types'
import { EventTypesResponse } from '../constantsReponse'

export const loadAllPublicChannels = (socket: any, channels: ChannelInfoResponse) => {
  socket.emit(EventTypesResponse.RESPONSE_GET_PUBLIC_CHANNELS, channels)
}
