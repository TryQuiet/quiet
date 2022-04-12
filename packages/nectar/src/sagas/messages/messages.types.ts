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
  peerId: string
  message: ChannelMessage
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
