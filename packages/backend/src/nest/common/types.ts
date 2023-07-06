import type EventStore from 'orbit-db-eventstore'
import { type ChannelMessage, type PublicChannel } from '@quiet/types'

export interface PublicChannelsRepo {
  db: EventStore<ChannelMessage>
  eventsAttached: boolean
}

export interface DirectMessagesRepo {
  db: EventStore<string>
  eventsAttached: boolean
}

export type ChannelInfoResponse = Record<string, PublicChannel>

export class StorageOptions {
  orbitDbDir?: string
  ipfsDir?: string
  createPaths = true
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
}

export interface ILibp2pStatus {
  address: string
  peerId: string
}
