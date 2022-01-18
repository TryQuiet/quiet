import { createEntityAdapter } from '@reduxjs/toolkit'

export const selectedPeersAdapter = createEntityAdapter<string>({
  selectId: (connectedPeer) => connectedPeer
})
