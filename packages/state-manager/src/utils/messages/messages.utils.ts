import { DisplayableMessage } from '@quiet/types'

export const isMessageUnsent = (
  message: DisplayableMessage,
  lastConnectedAtSeconds: number,
  allPeersDisconnectedAtSeconds: number | undefined | null,
  connectedPeers: string[],
  communityPeerList: string[] | undefined
): boolean => {
  // don't consider it unsent if its an info message
  if (message.type === 3) {
    return false
  }

  // Determine if a message is "unsent"
  const isRecent = lastConnectedAtSeconds < message.createdAt
  const communityHasPeers = communityPeerList != null && communityPeerList.length > 1
  const hasConnectedPeers = connectedPeers.length > 0
  const peersDisconnectedRecently =
    allPeersDisconnectedAtSeconds != null && allPeersDisconnectedAtSeconds < message.createdAt
  const noPeersThisSession = allPeersDisconnectedAtSeconds == null && connectedPeers.length > 0
  return communityHasPeers && isRecent && !hasConnectedPeers && (noPeersThisSession || peersDisconnectedRecently)
}
