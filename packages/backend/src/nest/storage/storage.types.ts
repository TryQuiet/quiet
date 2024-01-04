import { Certificates } from '@quiet/types'

export enum StorageEvents {
  // Peers
  UPDATE_PEERS_LIST = 'updatePeersList',
  // Public Channels
  LOAD_PUBLIC_CHANNELS = 'loadPublicChannels',
  LOAD_ALL_PRIVATE_CONVERSATIONS = 'loadAllPrivateConversations',
  LOAD_MESSAGES = 'loadMessages',
  SEND_MESSAGES_IDS = 'sendMessagesIds',
  SET_CHANNEL_SUBSCRIBED = 'setChannelSubscribed',
  CREATED_CHANNEL = 'createdChannel',
  CHANNEL_DELETION_RESPONSE = 'channelDeletionResponse',
  // Files
  REMOVE_DOWNLOAD_STATUS = 'removeDownloadStatus',
  UPLOADED_FILE = 'uploadedFile',
  UPDATE_DOWNLOAD_PROGRESS = 'updateDownloadProgress',
  UPDATE_MESSAGE_MEDIA = 'updateMessageMedia',
  CHECK_FOR_MISSING_FILES = 'checkForMissingFiles',
  // Direct Messages
  LOAD_ALL_DIRECT_MESSAGES = 'loadAllDirectMessages',
  // Misc
  SEND_PUSH_NOTIFICATION = 'sendPushNotification',
  // Users
  LOADED_USER_CSRS = 'loadedUserCsrs',
  REPLICATED_CSR = 'replicatedCsr',
  LOADED_CERTIFICATES = 'loadedCertificates',
  REPLICATED_CERTIFICATES = 'replicatedCertificates',
  // Community
  COMMUNITY_METADATA_SAVED = 'communityMetadataSaved',
}
export interface InitStorageParams {
  communityId: string
  peerId: any
  onionAddress: string
  targetPort: number
  peers?: string[]
  certs: Certificates
}

export interface CsrReplicatedPromiseValues {
  promise: Promise<unknown>
  resolveFunction: any
}

export interface DBOptions {
  replicate: boolean
}
