import { Certificates } from '@quiet/types'

export enum StorageEvents {
  // Public Channels
  CHANNEL_SUBSCRIBED = 'channelSubscribed',
  CHANNELS_STORED = 'channelsStored',
  MESSAGE_IDS_STORED = 'messageIdsStored',
  MESSAGES_STORED = 'messagesStored',
  // Files
  REMOVE_DOWNLOAD_STATUS = 'removeDownloadStatus',
  FILE_UPLOADED = 'fileUploaded',
  UPLOAD_PROGRESS = 'uploadProgress',
  DOWNLOAD_PROGRESS = 'downloadProgress',
  MESSAGE_MEDIA_UPDATED = 'messageMediaUpdated',
  CHECK_FOR_MISSING_FILES = 'checkForMissingFiles',
  // Misc
  SEND_PUSH_NOTIFICATION = 'sendPushNotification',
  // Users
  CSRS_STORED = 'csrsStored',
  CERTIFICATES_STORED = 'certificatesStored',
  USER_PROFILES_STORED = 'userProfilesStored',
  // Community
  COMMUNITY_METADATA_STORED = 'communityMetadataStored',
  COMMUNITY_UPDATED = 'communityUpdated',
}

export enum UnixFSEvents {
  WALK_FILE = 'unixfs:exporter:walk:file',
  GET_BLOCK_PROVIDERS = 'blocks:get:providers:get',
  GET_BLOCK = 'blocks:get:blockstore:get',
  WANT_BLOCK = 'bitswap:want-block:block',
  DOWNLOAD_BLOCK = 'blocks:get:blockstore:put',
}

export interface CsrReplicatedPromiseValues {
  promise: Promise<unknown>
  resolveFunction: any
}

export interface DBOptions {
  replicate: boolean
}
