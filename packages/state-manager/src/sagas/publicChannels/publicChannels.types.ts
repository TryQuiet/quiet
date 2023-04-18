import { Dictionary, EntityState } from '@reduxjs/toolkit'
import { FileMetadata } from '../files/files.types'

export interface PublicChannel {
  name: string
  description: string
  owner: string
  timestamp: number
  address: string
}

export interface PublicChannelStorage extends PublicChannel {
  messages: EntityState<ChannelMessage>
}

export interface PublicChannelStatus {
  address: string
  unread: boolean
  newestMessage: ChannelMessage
}

export interface PublicChannelSubscription {
  address: string
  subscribed: boolean
}

export interface ChannelMessage {
  id: string
  type: number
  message: string
  createdAt: number
  channelAddress: string
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
export interface DeletedChannelPayload {
  channel: string
}

export interface CreatedChannelResponse {
  channel: PublicChannel
}

export interface SetChannelSubscribedPayload {
  channelAddress: string
}

export interface SetCurrentChannelPayload {
  channelAddress: string
}

export interface SetChannelMessagesSliceValuePayload {
  messagesSlice: number
  channelAddress: string
}

export interface PendingMessage {
  message: ChannelMessage
}

export interface SendInitialChannelMessagePayload {
  channelName: string
  channelAddress: string
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
  channelAddress: string
}

export interface MarkUnreadChannelPayload {
  channelAddress: string
  message?: ChannelMessage
}

export interface UpdateNewestMessagePayload {
  message: ChannelMessage
}

export function instanceOfChannelMessage(object: any): object is ChannelMessage {
  return 'channelAddress' in object
}
