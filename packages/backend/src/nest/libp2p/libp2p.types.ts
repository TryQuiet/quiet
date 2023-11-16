import { Certificates } from '@quiet/types'
import { Agent } from 'http'

export enum Libp2pEvents {
  PEER_CONNECTED = 'peerConnected',
  PEER_DISCONNECTED = 'peerDisconnected',
  NETWORK_STATS = 'networkStats',
  DIAL_PEERS = 'dialPeers',
  UPDATE_KNOWN_PEERS_LIST = 'updateKnownPeersList',
}

export interface Libp2pNodeParams {
  peerId: any
  listenAddresses: string[]
  agent: Agent
  localAddress: string
  targetPort: number
  peers: string[]
  psk: Uint8Array
}

export interface InitLibp2pParams {
  peerId: any
  address: string
  addressPort: number
  targetPort: number
  bootstrapMultiaddrs: string[]
  certs: Certificates
}
