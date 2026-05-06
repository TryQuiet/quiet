import { createEntityAdapter } from '@reduxjs/toolkit'

export const connectedPeersAdapter = createEntityAdapter<string>({
  selectId: connectedPeer => connectedPeer,
})
