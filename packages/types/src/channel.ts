import { Dictionary, EntityState } from '@reduxjs/toolkit'
import { FileMetadata } from './files'

export interface PublicChannel {
  name: string
  description: string
  owner: string
  timestamp: number
  id: string
}

export interface PublicChannelStorage extends PublicChannel {
  messages: EntityState<ChannelMessage>
}

export interface PublicChannelStatus {
  id: string
  unread: boolean
  newestMessage: ChannelMessage
}

export interface PublicChannelSubscription {
  id: string
  subscribed: boolean
}

export interface ChannelMessage {
  id: string
  type: number
  message: string
  createdAt: number
  channelId: string
  signature: string
  pubKey: string
  media?: FileMetadata
}

export interface DisplayableMessage {
  id: string
  type: number
  message: string
  createdAt: number // seconds
  date: string // displayable
  nickname: string
  media?: FileMetadata
}

export interface MessagesDailyGroups {
  [date: string]: DisplayableMessage[][]
}

export interface ChannelsReplicatedPayload {
  channels: Dictionary<PublicChannel>
}

export interface CreateChannelPayload {
  channel: PublicChannel
}

export interface DeleteChannelPayload {
  channel: string
}
export interface ChannelDeletionResponsePayload {
  channel: string
}

export interface CreatedChannelResponse {
  channel: PublicChannel
}

export interface SetChannelSubscribedPayload {
  channelId: string
}

export interface SetCurrentChannelPayload {
  channelId: string
}

export interface SetChannelMessagesSliceValuePayload {
  messagesSlice: number
  channelId: string
}

export interface PendingMessage {
  message: ChannelMessage
}

export interface SendInitialChannelMessagePayload {
  channelName: string
  channelId: string
}
export interface SendNewUserInfoMessagePayload {
  certificates: string[]
}

export interface IncomingMessages {
  messages: ChannelMessage[]
  isVerified?: boolean
}

export interface CacheMessagesPayload {
  messages: ChannelMessage[]
  channelId: string
}

export interface MarkUnreadChannelPayload {
  channelId: string
  message?: ChannelMessage
}

export interface UpdateNewestMessagePayload {
  message: ChannelMessage
}

export interface DeleteChannelFromStorePayload {
  channelId: string
}

export interface ClearMessagesCachePayload {
  channelId: string
}

export function instanceOfChannelMessage(object: any): object is ChannelMessage {
  return 'channelId' in object
}
