import { ChannelType, PublicChannel, UserProfile } from '@quiet/types'

import crypto from 'crypto'

export const generateDmMemberHash = (memberIds: string[]) =>
  crypto
    .createHash('sha256')
    .update([...new Set(memberIds)].sort().toString())
    .digest()
    .toString('base64')

export const generateDmChannelDisplayName = (
  memberIds: string[] | undefined,
  userProfiles: Record<string, UserProfile>,
  me: UserProfile | undefined
): string => {
  if (memberIds == null) return 'Empty DM Channel Name'
  if (memberIds.length === 1) {
    return me?.nickname ?? 'Me'
  }

  return memberIds
    .filter(id => id !== me?.userId)
    .map(id => userProfiles[id]?.nickname)
    .sort()
    .join(', ')
}

/**
 * The people in a DM I am starting or looking up, in the one form every DM is identified by: my own
 * user id always included, each user once, sorted.
 *
 * A DM always has me in it, so callers name only the others they chose — or nobody else, for a DM
 * with myself — and never assemble the list by hand. Hand-built lists are how a self-DM once came out
 * as `[me, me]` in one place and `[me]` in another.
 */
export const dmMemberIdsFor = (memberIds: string[], myUserId: string): string[] =>
  [...new Set([...memberIds, myUserId])].sort()

/** `memberIdHash` of the DM between me and these people; see {@link dmMemberIdsFor}. */
export const dmMemberHashFor = (memberIds: string[], myUserId: string): string =>
  generateDmMemberHash(dmMemberIdsFor(memberIds, myUserId))

/**
 * The DM between me and exactly these people, if one exists.
 *
 * A DM's participants are fixed at creation, so the set of member ids identifies the conversation:
 * `memberIdHash` is that set hashed, order- and duplicate-independent. Starting a DM with someone
 * you already have one with must reopen it rather than make a second, which is why every entry
 * point — the composer on desktop and mobile, and a profile's Message button — asks this question
 * first, and asks it here.
 *
 * `memberIds` are the people chosen besides me (me among them is harmless). Choosing nobody finds
 * nothing: an empty selection is not a request for the DM with myself, which is `[myUserId]`.
 *
 * Falls back to hashing memberIds for channels replicated before the hash was stored.
 */
export const findDmChannelWithMembers = (
  memberIds: string[],
  myUserId: string,
  channels: PublicChannel[]
): PublicChannel | undefined => {
  if (memberIds.length === 0) return undefined
  const wanted = dmMemberHashFor(memberIds, myUserId)
  return channels.find(channel => {
    if (channel.type !== ChannelType.DM) return false
    const hash = channel.memberIdHash ?? (channel.memberIds ? generateDmMemberHash(channel.memberIds) : undefined)
    return hash === wanted
  })
}
