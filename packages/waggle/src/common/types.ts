import EventStore from 'orbit-db-eventstore'

export interface IMessage {
  id: string
  type: number
  message: string
  createdAt: number
  channelId: string
  signature: string
  pubKey: string
}

export interface IRepo {
  db: EventStore<IMessage>
  eventsAttached: boolean
}

export interface IChannelInfo {
  name: string
  description: string
  owner: string
  timestamp: number
  address: string
  keys: { ivk?: string, sk?: string }
}

export interface ChannelInfoResponse {
  [name: string]: IChannelInfo
}

export class StorageOptions {
  createPaths: boolean = true
  isWaggleMobileMode: boolean
  isEntryNode?: boolean = false
}

export interface IZbayChannel extends IChannelInfo {
  orbitAddress: string
}

export interface IPublicKey {
  halfKey: string
}
export type IMessageThread = string

export class ConnectionsManagerOptions {
  env: {
    appDataPath?: string
  } = {}

  bootstrapMultiaddrs?: string[] = []
  createPaths?: boolean = true
  isWaggleMobileMode?: boolean = true
  isEntryNode?: boolean = false
}

export interface IConstructor {
  host: string
  port: number
  agentPort: number
  agentHost: string
  options?: Partial<ConnectionsManagerOptions>
  io: any
}

export interface ILibp2pStatus {
  address: string
  peerId: string
}

export interface DataFromPems {
  certificate: string
  privKey: string
}
