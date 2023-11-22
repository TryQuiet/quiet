import { type NetworkStats } from '@quiet/types'
import { createEntityAdapter } from '@reduxjs/toolkit'

export const peersStatsAdapter = createEntityAdapter<NetworkStats>({
    selectId: peer => peer.peerId,
})
