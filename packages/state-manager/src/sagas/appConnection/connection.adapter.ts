import { createEntityAdapter } from '@reduxjs/toolkit'
import { NetworkStats } from './connection.slice'

export const peersStatsAdapter = createEntityAdapter<NetworkStats>({
  selectId: (peer) => peer.peerId
})
