import { ChannelMessage } from '../publicChannels/publicChannels.types'

export enum MessageType {
  Empty = -1,
  Basic = 1,
}

export enum SendingStatus {
  Pending = 0,
  Sent = 1
}

export interface SendMessagePayload {
  message: ChannelMessage
  peerId: string
}

export interface WriteMessagePayload {
  message: string
  channelAddress?: string
}

export interface PublicKeyMappingPayload {
  publicKey: string
  cryptoKey: CryptoKey
}

export interface MessageVerificationStatus {
  publicKey: string
  signature: string
  verified: boolean
}

export interface MessageSendingStatus {
  id: string,
  status: SendingStatus
}
