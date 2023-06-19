import { type EntityState } from '@reduxjs/toolkit'
import { type FileMetadata } from '../files/files.types'
import { type ChannelMessage } from '../publicChannels/publicChannels.types'

export enum MessageType {
  Empty = -1,
  Basic = 1,
  Image = 2,
  Info = 3,
  File = 4,
}

export enum SendingStatus {
  Pending = 0,
  Sent = 1,
}

export interface SendMessagePayload {
  message: ChannelMessage
  peerId: string
}

export interface PushNotificationPayload {
  message: string
  username: string
}

export interface WriteMessagePayload {
  message: string
  id?: string
  channelId?: string
  type?: MessageType
  media?: FileMetadata
}

export interface PublicKeyMappingPayload {
  publicKey: string
  cryptoKey: CryptoKey
}

export interface AddPublicChannelsMessagesBasePayload {
  channelId: string
}

export interface PublicChannelsMessagesBase {
  channelId: string
  messages: EntityState<ChannelMessage>
  display: number
}

export interface SetDisplayedMessagesNumberPayload {
  channelId: string
  display: number
}

export interface LazyLoadingPayload {
  load: boolean
}

export interface MessageVerificationStatus {
  publicKey: string
  signature: string
  isVerified: boolean
}

export interface MessageSendingStatus {
  id: string
  status: SendingStatus
}

export interface AskForMessagesPayload {
  ids: string[]
  peerId: string
  channelId: string
  communityId: string
}

export interface ChannelMessagesIdsResponse {
  ids: string[]
  channelId: string
  communityId: string
}

export interface DeleteChannelEntryPayload {
  channelId: string
}

export interface SendDeletionMessagePayload {
  channelId: string
}
