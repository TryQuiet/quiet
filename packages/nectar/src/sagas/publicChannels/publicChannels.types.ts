export interface PublicChannel {
  name: string
  description: string
  owner: string
  timestamp: number
  address: string
}

export interface ChannelMessage {
  id: string
  type: number
  message: string
  createdAt: number
  channelId: string
  signature: string
  pubKey: string
}

export interface DisplayableMessage {
  id: string
  type: number
  message: string
  createdAt: number // seconds
  date: string // displayable
  nickname: string
}

export type MessagesGroupedByDay = Array<{
  day: string
  messages: DisplayableMessage[]
}>
