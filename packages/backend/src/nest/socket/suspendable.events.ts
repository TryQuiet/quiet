import { SocketActions, SocketEvents } from '@quiet/types'

export const suspendableSocketEvents: string[] = [
  // Channels
  SocketActions.CREATE_CHANNEL.valueOf(),
  SocketActions.DELETE_CHANNEL.valueOf(),

  // Files
  SocketActions.ATTACH_FILE.valueOf(),
  SocketActions.DOWNLOAD_FILE.valueOf(),
  SocketActions.CANCEL_DOWNLOAD.valueOf(),
  SocketActions.DELETE_FILES_FROM_CHANNEL.valueOf(),

  // Messages
  SocketActions.SEND_MESSAGE.valueOf(),
  SocketActions.GET_MESSAGES.valueOf(),
  SocketEvents.MESSAGE_MEDIA_UPDATED.valueOf(),
]
