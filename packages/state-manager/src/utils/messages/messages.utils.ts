import { DisplayableMessage } from '@quiet/types'
import createLogger from '../logger'

const logger = createLogger('messages:utils')

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

  logger.info('isMessageUnsent: ', JSON.stringify({
    message,
    lastConnectedAtSeconds,
    allPeersDisconnectedAtSeconds,
    connectedPeers,
    communityPeerList
  }, null, 2))

  // Determine if a message is "unsent"
  const isRecent = lastConnectedAtSeconds < message.createdAt
  const communityHasPeers = communityPeerList != null && communityPeerList.length > 1
  const hasConnectedPeers = connectedPeers.length > 0
  const peersDisconnectedRecently =
    allPeersDisconnectedAtSeconds != null && allPeersDisconnectedAtSeconds < message.createdAt
  const noPeersThisSession = allPeersDisconnectedAtSeconds == null && communityHasPeers
  return communityHasPeers && isRecent && !hasConnectedPeers && (noPeersThisSession || peersDisconnectedRecently)
}
