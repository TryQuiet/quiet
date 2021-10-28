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
}

export interface ChannelInfoResponse {
  [name: string]: IChannelInfo
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
  isEntryNode?: boolean = false
  createSnapshot?: boolean = false
  useSnapshot?: boolean = false
  libp2pTransportClass?: any = null
  spawnTor?: boolean = true
  torControlPort: number
  torPassword?: string
  torAuthCookie?: string
  useLocalTorFiles?: boolean = false // Use tor binaries and their libs from waggle
}

export interface IConstructor {
  host: string
  port: number
  agentPort?: number
  httpTunnelPort?: number
  agentHost?: string
  options?: Partial<ConnectionsManagerOptions>
  io: any
  storageClass?: any // TODO: what type?
}

export interface ILibp2pStatus {
  address: string
  peerId: string
}

export interface DataFromPems {
  certificate: string
  privKey: string
}

export interface CertsData {
  cert: string
  key: string
  ca: string[]
}
