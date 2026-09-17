/**
 * Whether a direct-message conversation should show its presence dot.
 *
 * The sidebar row and the channel header show the same avatar for the same conversation, so they
 * have to answer this the same way; the rule lives here rather than in either of them.
 *
 * - one-to-one: the other person is online;
 * - group: ANY other participant is online;
 * - the conversation with yourself: you cannot be your own peer, so it follows whether this app is
 *   on the network at all.
 *
 * Presence is asked by user id, never by peer id: since device linking one user has one endpoint
 * per device and is reachable when any of them is connected.
 */
export const isDmConnected = (
  memberIds: string[] | undefined,
  myUserId: string | undefined,
  isUserConnected: (userId: string | undefined) => boolean,
  isTorInitialized: boolean
): boolean => {
  if (memberIds == null || myUserId == null) return false
  const otherMemberIds = memberIds.filter(memberId => memberId !== myUserId)
  if (otherMemberIds.length === 0) return isTorInitialized
  return otherMemberIds.some(memberId => isUserConnected(memberId))
}
