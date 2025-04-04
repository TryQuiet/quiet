import { type EntityState } from '@reduxjs/toolkit'
import { type FileMetadata } from './files'

export const INITIAL_CURRENT_CHANNEL_ID = 'initialcurrentChannelId'

export interface PublicChannel {
  id: string
  name: string
  description: string
  owner: string
  timestamp: number
  disabled?: boolean
}

export interface PublicChannelStorage extends PublicChannel {
  messages: EntityState<ChannelMessage>
}

export interface PublicChannelStatus {
  id: string
  unread: boolean
  newestMessage: ChannelMessage | null
}

export interface PublicChannelStatusWithName extends PublicChannelStatus {
  name: string
}

export interface PublicChannelSubscription {
  id: string
  subscribed: boolean
}

// NOTE: These are all typed as any because they are all LFA types and I don't wanna import LFA into
// the types package.
export interface SignatureAuthor {
  generation: number
  type: string
  name: string
}

export interface EncryptionSignature {
  signature: any
  author: SignatureAuthor
}

export interface ChannelMessage {
  id: string
  type: number
  message: string
  createdAt: number
  channelId: string
  userId: string
  encSignature?: EncryptionSignature
  media?: FileMetadata
}

export interface ConsumedChannelMessage extends ChannelMessage {
  verified?: boolean
}

export interface DisplayableMessage {
  id: string
  type: number
  userId: string
  message: string
  createdAt: number // seconds
  date: string // displayable
  nickname: string
  media?: FileMetadata
  isRegistered: boolean
  isDuplicated: boolean
  photo?: string // base64 encoded image
  pubkey?: string // deprecated
  signature?: string // deprecated
}

export type MessagesGroupsType = Record<string, DisplayableMessage[]>

export type MessagesDailyGroups = Record<string, DisplayableMessage[][]>

export interface ChannelsReplicatedPayload {
  channels: PublicChannel[]
}

export interface CreateChannelPayload {
  id: string
  name: string
  description?: string
}

export interface CreateChannelResponse {
  channel: PublicChannel
}

export interface DeleteChannelPayload {
  channelId: string
}

export interface DeleteChannelResponse {
  channelId: string
  deleted: boolean
}

export interface ChannelSubscribedPayload {
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

export interface MessagesLoadedPayload {
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

export interface DisableChannelPayload {
  channelId: string
}

export interface ChannelStructure {
  channelName: string | null
  channelId: string | null
}

export function instanceOfChannelMessage(object: ChannelMessage): boolean {
  return 'channelId' in object
}
