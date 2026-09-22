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
 * The DM shared by exactly this set of people, if one exists.
 *
 * A DM's participants are fixed at creation, so the set of member ids identifies the conversation:
 * `memberIdHash` is that set hashed, order- and duplicate-independent. Starting a DM with someone
 * you already have one with must reopen it rather than make a second, which is why every entry
 * point — the composer, and now a profile's Message button — asks this question first.
 *
 * Falls back to hashing memberIds for channels replicated before the hash was stored.
 */
export const findDmChannelWithMembers = (memberIds: string[], channels: PublicChannel[]): PublicChannel | undefined => {
  if (memberIds.length === 0) return undefined
  const wanted = generateDmMemberHash(memberIds)
  return channels.find(channel => {
    if (channel.type !== ChannelType.DM) return false
    const hash = channel.memberIdHash ?? (channel.memberIds ? generateDmMemberHash(channel.memberIds) : undefined)
    return hash === wanted
  })
}
