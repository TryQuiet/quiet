import { Certificates } from '@quiet/types'

export enum StorageEvents {
  // Peers
  UPDATE_PEERS_LIST = 'updatePeersList',
  // Public Channels
  CHANNELS_LOADED = 'channelsLoaded',
  MESSAGES_LOADED = 'messagesLoaded',
  SEND_MESSAGES_IDS = 'sendMessagesIds',
  CHANNEL_SUBSCRIBED = 'channelSubscribed',
  // Files
  REMOVE_DOWNLOAD_STATUS = 'removeDownloadStatus',
  FILE_UPLOADED = 'fileUploaded',
  UPDATE_DOWNLOAD_PROGRESS = 'updateDownloadProgress',
  UPDATE_MESSAGE_MEDIA = 'updateMessageMedia',
  CHECK_FOR_MISSING_FILES = 'checkForMissingFiles',
  // Misc
  SEND_PUSH_NOTIFICATION = 'sendPushNotification',
  // Users
  CSRS_LOADED = 'csrsLoaded',
  CERTIFICATES_LOADED = 'certificatesLoaded',
  USER_PROFILES_LOADED = 'userProfilesLoaded',
  // Community
  COMMUNITY_METADATA_LOADED = 'communityMetadataLoaded',
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
