import { type EntityState } from '@reduxjs/toolkit'
import { type FileMetadata } from './files'
import { Base58, KeyMetadata } from '@localfirst/crdx'

export const PROFILE_PHOTO_CHANNEL_ID = '__profile-photo__'

export const INITIAL_CURRENT_CHANNEL_ID = 'initialcurrentChannelId'

export enum ChannelType {
  CHANNEL = 'channel',
  DM = 'dm',
}

export interface PublicChannel {
  id: string
  name: string
  description: string
  owner: string
  timestamp: number
  disabled?: boolean
  public: boolean
  roleName?: string
  type: ChannelType
  memberIds?: string[]
}

export interface PublicChannelStorage extends PublicChannel {
  messages: EntityState<ChannelMessage>
  displayedName: string
}

export interface PublicChannelStatus {
  id: string
  unread: boolean
  newestMessage: ChannelMessage | null
  public: boolean
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
export interface SignatureAuthor extends KeyMetadata {}

export interface EncryptionSignature {
  signature: Base58
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
  photo?: string // base64 encoded image, deprecated
  profilePhoto?: FileMetadata
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
  public?: boolean
  description?: string
  type: ChannelType
  memberIds?: string[]
}

export interface CreateChannelResponse {
  channel: PublicChannel
  displayedName?: string
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
  type: ChannelType
}

export interface MessagesLoadedPayload {
  messages: ChannelMessage[]
  isVerified?: boolean
}

export interface VerifyMessagesPayload {
  messageIds?: string[]
  channelId?: string
  messages?: ChannelMessage[]
  currentChannel?: boolean
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

export interface AddMembersChannelPayload {
  channelId: string
  channelName: string
  memberIds: string[]
}

export enum AddMembersChannelStatus {
  SUCCESS = 'SUCCESS',
  FAILURE = 'FAILURE',
  CHANNEL_MISSING = 'CHANNEL_MISSING',
  NOT_MEMBER = 'NOT_MEMBER',
}

export interface AddMembersChannelResponse {
  channelId: string
  status: AddMembersChannelStatus
}

export function instanceOfChannelMessage(object: ChannelMessage): boolean {
  return 'channelId' in object
}
