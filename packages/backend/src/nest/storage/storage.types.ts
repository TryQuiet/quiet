import { Certificates } from '@quiet/types'

export enum StorageEvents {
  // Peers
  UPDATE_PEERS_LIST = 'updatePeersList',
  // Public Channels
  LOAD_PUBLIC_CHANNELS = 'loadPublicChannels',
  LOAD_MESSAGES = 'loadMessages',
  SEND_MESSAGES_IDS = 'sendMessagesIds',
  CHANNEL_SUBSCRIBED = 'channelSubscribed',
  // Files
  REMOVE_DOWNLOAD_STATUS = 'removeDownloadStatus',
  UPLOADED_FILE = 'uploadedFile',
  UPDATE_DOWNLOAD_PROGRESS = 'updateDownloadProgress',
  UPDATE_MESSAGE_MEDIA = 'updateMessageMedia',
  CHECK_FOR_MISSING_FILES = 'checkForMissingFiles',
  // Misc
  SEND_PUSH_NOTIFICATION = 'sendPushNotification',
  // Users
  LOADED_USER_CSRS = 'loadedUserCsrs',
  REPLICATED_CSR = 'replicatedCsr',
  LOADED_CERTIFICATES = 'loadedCertificates',
  REPLICATED_CERTIFICATES = 'replicatedCertificates',
  LOADED_USER_PROFILES = 'loadedUserProfiles',
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
