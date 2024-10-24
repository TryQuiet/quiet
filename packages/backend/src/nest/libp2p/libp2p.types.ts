import { PeerId } from '@libp2p/interface'
import { Agent } from 'http'

export enum Libp2pEvents {
  PEER_CONNECTED = 'peerConnected',
  PEER_DISCONNECTED = 'peerDisconnected',
  NETWORK_STATS = 'networkStats',
}

export interface Libp2pNodeParams {
  peerId: PeerId
  listenAddresses: string[]
  agent: Agent
  localAddress: string
  targetPort: number
  psk: Uint8Array
}

export type Libp2pPeerInfo = {
  dialed: string[]
  connected: string[]
}

export type Libp2pConnectedPeer = {
  address: string
  connectedAtSeconds: number
}
