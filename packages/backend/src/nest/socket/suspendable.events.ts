import { SocketActionTypes } from '@quiet/types'

export const suspendableSocketEvents: string[] = [
  // Channels
  SocketActionTypes.CREATE_CHANNEL.valueOf(),
  SocketActionTypes.DELETE_CHANNEL.valueOf(),

  // Files
  SocketActionTypes.UPLOAD_FILE.valueOf(),
  SocketActionTypes.DOWNLOAD_FILE.valueOf(),
  SocketActionTypes.CANCEL_DOWNLOAD.valueOf(),
  SocketActionTypes.DELETE_FILES_FROM_CHANNEL.valueOf(),

  // Messages
  SocketActionTypes.SEND_MESSAGE.valueOf(),
  SocketActionTypes.GET_MESSAGES.valueOf(),
  SocketActionTypes.UPDATE_MESSAGE_MEDIA.valueOf(),
]
