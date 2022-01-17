import SocketIO from 'socket.io'
import { ChannelMessage, SocketActionTypes } from '@zbayapp/nectar'

export const message = (socket: SocketIO.Server, message) => {
  console.log('Emitting message to zbay')
  socket.emit(SocketActionTypes.MESSAGE, message)
}

export const directMessage = (socket: SocketIO.Server, message) => {
  socket.emit(SocketActionTypes.DIRECT_MESSAGE, message)
}

export const loadAllMessages = (
  socket: SocketIO.Server,
  messages: ChannelMessage[],
  channelAddress: string,
  communityId: string
) => {
  if (messages.length === 0) {
    return
  }
  socket.emit(SocketActionTypes.RESPONSE_FETCH_ALL_MESSAGES, {
    communityId,
    channelAddress,
    messages
  })
}

export const sendIdsToZbay = (
  socket: SocketIO.Server,
  payload: { ids: string[]; channelAddress: string; communityId: string }
) => {
  if (payload.ids.length === 0) {
    return
  }
  socket.emit(SocketActionTypes.SEND_IDS, payload)
}

export const loadAllDirectMessages = (
  socket: SocketIO.Server,
  messages: string[],
  channelAddress: string
) => {
  if (messages.length === 0) {
    return
  }
  socket.emit(SocketActionTypes.RESPONSE_FETCH_ALL_DIRECT_MESSAGES, {
    channelAddress,
    messages
  })
}
