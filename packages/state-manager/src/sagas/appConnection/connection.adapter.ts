import { createEntityAdapter } from '@reduxjs/toolkit'
import { NetworkStats } from './connection.slice'

export const connectedPeersAdapter = createEntityAdapter<string>({
  selectId: (connectedPeer) => connectedPeer
})

export const peersStatsAdapter = createEntityAdapter<NetworkStats>({
  selectId: (peer) => peer.peerId
})