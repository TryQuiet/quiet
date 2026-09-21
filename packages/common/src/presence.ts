/**
 * Who counts as online, in one place for both platforms.
 *
 * Since device linking, a user is one identity across several devices, so presence is a property
 * of the USER: they are reachable when ANY of their devices' peers is connected. The store answers
 * that question (`connection.selectors.isUserConnected`); this module holds the two rules built on
 * top of it, which every sidebar row, channel header and membership list has to agree on.
 *
 * Both rules take the predicate rather than reading a store, so they are pure and can be unit
 * tested and shared by desktop and mobile.
 */

/** A predicate over user ids, as `connection.selectors.isUserConnected` returns. */
export type IsUserConnected = (userId: string | undefined) => boolean

/**
 * Presence for one person in a list of people: a membership list, an add-members panel, a
 * recipient picker.
 *
 * Your own row cannot be answered by a peer connection, because you are not your own peer. It
 * follows whether this app is on the network at all. Getting this wrong in either direction is
 * visible: reading your own row through remote presence shows you offline while you are using the
 * app, and hard-coding it to online claims you are connected while Tor is still starting.
 */
export const isMemberConnected = (
  userId: string | undefined,
  myUserId: string | undefined,
  isUserConnected: IsUserConnected,
  isTorInitialized: boolean
): boolean => {
  if (userId == null) return false
  if (myUserId != null && userId === myUserId) return isTorInitialized
  return isUserConnected(userId)
}

/**
 * Presence for a direct-message conversation: its sidebar row and its channel header, which show
 * the same avatar and so must give the same answer.
 *
 * - one-to-one: the other person is online;
 * - group: ANY other participant is online, not merely whichever one the avatar happens to show;
 * - the conversation with yourself: the same self rule as `isMemberConnected`.
 */
export const isDmConnected = (
  memberIds: string[] | undefined,
  myUserId: string | undefined,
  isUserConnected: IsUserConnected,
  isTorInitialized: boolean
): boolean => {
  if (memberIds == null || myUserId == null) return false
  const otherMemberIds = memberIds.filter(memberId => memberId !== myUserId)
  if (otherMemberIds.length === 0) return isTorInitialized
  return otherMemberIds.some(memberId => isUserConnected(memberId))
}
