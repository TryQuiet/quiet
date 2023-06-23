import { Certificates } from '@quiet/types'
import { Agent } from 'http'

export enum Libp2pEvents {
  PEER_CONNECTED = 'peerConnected',
  PEER_DISCONNECTED = 'peerDisconnected',
  NETWORK_STATS = 'networkStats'
}

export interface Libp2pNodeParams {
  peerId: any
  listenAddresses: string[]
  agent: Agent
  cert: string
  key: string
  ca: string[]
  localAddress: string
  targetPort: number
  peers: string[]
}

export interface InitLibp2pParams {
  peerId: any
  address: string
  addressPort: number
  targetPort: number
  bootstrapMultiaddrs: string[]
  certs: Certificates
}
