import { EventTypesServer } from '../constants'
import { IMessage } from '../../common/types'
import { EventTypesResponse } from '../constantsReponse'

export const message = (socket: SocketIO.Server, message) => {
  console.log('emitting message to zbay')
  socket.emit(EventTypesServer.MESSAGE, message)
}

export const directMessage = (socket: SocketIO.Server, message) => {
  socket.emit(EventTypesServer.DIRECT_MESSAGE, message)
}

export const loadAllMessages = (
  socket: SocketIO.Server,
  messages: IMessage[],
  channelAddress: string,
  communityId: string
) => {
  if (messages.length === 0) {
    return
  }
  socket.emit(EventTypesResponse.RESPONSE_FETCH_ALL_MESSAGES, {
    communityId,
    channelAddress,
    messages
  })
}

export const sendIdsToZbay = (socket: SocketIO.Server, payload: { ids: string[], channelAddress: string, communityId: string }) => {
  if (payload.ids.length === 0) {
    return
  }
  socket.emit(EventTypesResponse.SEND_IDS, payload)
}

export const loadAllDirectMessages = (socket: SocketIO.Server, messages: string[], channelAddress: string) => {
  if (messages.length === 0) {
    return
  }
  socket.emit(EventTypesResponse.RESPONSE_FETCH_ALL_DIRECT_MESSAGES, {
    channelAddress,
    messages
  })
}
