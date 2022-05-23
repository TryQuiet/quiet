import { Dictionary, EntityState } from '@reduxjs/toolkit'
import { FileMetadata } from '../files/files.types'

export interface CommunityChannels {
  id: string
  currentChannelAddress: string
  channels: EntityState<PublicChannelStorage>
  channelsStatus: EntityState<PublicChannelStatus>
}

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
}

export interface ChannelMessage {
  id: string
  type: number
  message: string
  createdAt: number
  channelAddress: string
  signature: string
  pubKey: string
  media: FileMetadata
}

export interface DisplayableMessage {
  id: string
  type: number
  message: string
  createdAt: number // seconds
  date: string // displayable
  nickname: string
}

export interface MessagesDailyGroups {
  [date: string]: DisplayableMessage[][]
}

export interface GetPublicChannelsResponse {
  communityId: string
  channels: Dictionary<PublicChannel>
}

export interface CreatedChannelResponse {
  channel: PublicChannel
  communityId: string
}

export interface SubscribeToTopicPayload {
  peerId: string
  channelData: PublicChannel
}

export interface AddPublicChannelsListPayload {
  id: string
}

export interface SetCurrentChannelPayload {
  channelAddress: string
  communityId: string
}

export interface SetChannelMessagesSliceValuePayload {
  messagesSlice: number
  channelAddress: string
  communityId: string
}

export interface CreateChannelPayload {
  channel: PublicChannel
  communityId: string
}

export interface CreateGeneralChannelPayload {
  communityId: string
}

export interface PendingMessage {
  message: ChannelMessage
  communityId: string
}

export interface SendInitialChannelMessagePayload {
  channelName: string
  channelAddress: string
}

export interface IncomingMessages {
  messages: ChannelMessage[]
  communityId: string
}

export interface CacheMessagesPayload {
  messages: ChannelMessage[]
  channelAddress: string
  communityId: string
}

export interface MarkUnreadChannelPayload {
  channelAddress: string
  communityId: string
}
