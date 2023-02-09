import { createEntityAdapter } from '@reduxjs/toolkit'
import { NetworkStats } from './connection.types'

export const peersStatsAdapter = createEntityAdapter<NetworkStats>({
  selectId: (peer) => peer.peerId
})
