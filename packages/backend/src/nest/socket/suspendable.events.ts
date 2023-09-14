import { SocketActionTypes } from "@quiet/types";

export const suspendableSocketEvents: string[] = [
  // A
  SocketActionTypes.ASK_FOR_MESSAGES.valueOf(),
  // C
  SocketActionTypes.CANCEL_DOWNLOAD.valueOf(),
  SocketActionTypes.CREATE_CHANNEL.valueOf(),
  // D
  SocketActionTypes.DOWNLOAD_FILE.valueOf(),
  SocketActionTypes.DELETE_CHANNEL.valueOf(),
  SocketActionTypes.DELETE_FILES_FROM_CHANNEL.valueOf(),
  // E
  // G
  SocketActionTypes.GET_PRIVATE_CONVERSATIONS.valueOf(),
  SocketActionTypes.GET_PUBLIC_CHANNELS.valueOf(),
  // I
  SocketActionTypes.INITIALIZE_CONVERSATION.valueOf(),
  // R
  SocketActionTypes.REGISTER_USER_CERTIFICATE.valueOf(),
  SocketActionTypes.REGISTER_OWNER_CERTIFICATE.valueOf(),
  SocketActionTypes.REQUEST_PEER_ID.valueOf(),
  // S
  SocketActionTypes.SAVE_OWNER_CERTIFICATE.valueOf(),
  SocketActionTypes.SAVE_USER_CSR.valueOf(),
  SocketActionTypes.SAVE_COMMUNITY_METADATA.valueOf(),
  SocketActionTypes.SEND_DIRECT_MESSAGE.valueOf(),
  SocketActionTypes.SEND_MESSAGE.valueOf(),
  SocketActionTypes.SEND_MESSAGES_IDS.valueOf(),
  SocketActionTypes.SEND_PEER_ID.valueOf(),
  SocketActionTypes.SEND_USER_CERTIFICATE.valueOf(),
  SocketActionTypes.SEND_COMMUNITY_METADATA.valueOf(),
  SocketActionTypes.SUBSCRIBE_FOR_ALL_CONVERSATIONS.valueOf(),
  SocketActionTypes.SUBSCRIBE_FOR_DIRECT_MESSAGE_THREAD.valueOf(),
  // U
  SocketActionTypes.UPDATE_MESSAGE_MEDIA.valueOf(),
  SocketActionTypes.UPLOAD_FILE.valueOf(),
  SocketActionTypes.CHECK_FOR_MISSING_FILES.valueOf(),
]
