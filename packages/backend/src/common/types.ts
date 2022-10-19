import EventStore from 'orbit-db-eventstore'
import { ChannelMessage, PublicChannel } from '@quiet/state-manager'

export interface PublicChannelsRepo {
  db: EventStore<ChannelMessage>
  eventsAttached: boolean
}

export interface DirectMessagesRepo {
  db: EventStore<string>
  eventsAttached: boolean
}

export interface ChannelInfoResponse {
  [name: string]: PublicChannel
}

export class StorageOptions {
  orbitDbDir?: string
  ipfsDir?: string
  createPaths: boolean = true
  isEntryNode?: boolean = false
}

export interface IPublicKey {
  halfKey: string
}

export type IMessageThread = string

export class ConnectionsManagerOptions {
  env: {
    appDataPath?: string
    resourcesPath?: string
  } = {}

  bootstrapMultiaddrs?: string[] = []
  createPaths?: boolean = true
  torControlPort: number
  torPassword?: string
  torAuthCookie?: string
}

export interface ILibp2pStatus {
  address: string
  peerId: string
}
