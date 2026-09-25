import { type UserProfile } from '@quiet/types'
import { getChannelMembers, ChannelMembership } from '@quiet/common'

// Membership itself lives in @quiet/common so desktop and mobile answer it the same way.
export { getChannelMembers }
export type { ChannelMembership }

/**
 * Who could still be added to a channel — the community minus the channel's members. Derived from
 * getChannelMembers so the two cannot disagree about what membership means.
 */
export const getChannelNonMembers = (
  channel: ChannelMembership | undefined,
  userProfiles: Record<string, UserProfile>
): UserProfile[] => {
  const memberIds = new Set(getChannelMembers(channel, userProfiles).map(profile => profile.userId))
  return Object.values(userProfiles).filter(profile => !memberIds.has(profile.userId))
}

/** How many people are in a channel. */
export const countChannelMembers = (
  channel: ChannelMembership | undefined,
  userProfiles: Record<string, UserProfile>
): number => getChannelMembers(channel, userProfiles).length

/** "1 member" / "32 members", as the design's meta line reads it (Figma 838:9711). */
export const memberCountLabel = (count: number): string => `${count} ${count === 1 ? 'member' : 'members'}`
