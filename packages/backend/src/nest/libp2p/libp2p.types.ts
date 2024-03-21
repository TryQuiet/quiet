import { Certificates } from '@quiet/types'
import { Agent } from 'http'

export enum Libp2pEvents {
  PEER_CONNECTED = 'peerConnected',
  PEER_DISCONNECTED = 'peerDisconnected',
  NETWORK_STATS = 'networkStats',
  DIAL_PEERS = 'dialPeers',
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
