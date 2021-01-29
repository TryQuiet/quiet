import { EventTypesResponse } from '../constantsReponse'

export const loadAllMessages = (socket, messages, channelAddress) => {
  socket.emit(EventTypesResponse.RESPONSE_FETCH_ALL_MESSAGES, {
    channelAddress,
    messages
  })
}
