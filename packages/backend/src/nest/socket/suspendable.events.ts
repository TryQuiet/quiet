import { SocketActionTypes } from '@quiet/types'

export const suspendableSocketEvents: string[] = [
  // Channels
  SocketActionTypes.CREATE_CHANNEL.valueOf(),
  SocketActionTypes.DELETE_CHANNEL.valueOf(),

  // Files
  SocketActionTypes.UPLOAD_FILE.valueOf(),
  SocketActionTypes.DOWNLOAD_FILE.valueOf(),
  SocketActionTypes.CANCEL_DOWNLOAD.valueOf(),
  SocketActionTypes.CHECK_FOR_MISSING_FILES.valueOf(),
  SocketActionTypes.DELETE_FILES_FROM_CHANNEL.valueOf(),

  // Messages
  SocketActionTypes.SEND_MESSAGE.valueOf(),
  SocketActionTypes.ASK_FOR_MESSAGES.valueOf(),
  SocketActionTypes.UPDATE_MESSAGE_MEDIA.valueOf(),

  // Private Conversations
  SocketActionTypes.SUBSCRIBE_FOR_ALL_CONVERSATIONS.valueOf(),
  SocketActionTypes.GET_PRIVATE_CONVERSATIONS.valueOf(),
  SocketActionTypes.INITIALIZE_CONVERSATION.valueOf(),
  SocketActionTypes.SEND_DIRECT_MESSAGE.valueOf(),
  SocketActionTypes.SUBSCRIBE_FOR_DIRECT_MESSAGE_THREAD.valueOf(),
]
