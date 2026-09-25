import { type UserProfile } from '@quiet/types'
import { getChannelMembers, getChannelNonMembers, ChannelMembership } from '@quiet/common'

// Membership itself lives in @quiet/common so desktop and mobile answer it the same way.
export { getChannelMembers, getChannelNonMembers }
export type { ChannelMembership }

/** How many people are in a channel. */
export const countChannelMembers = (
  channel: ChannelMembership | undefined,
  userProfiles: Record<string, UserProfile>
): number => getChannelMembers(channel, userProfiles).length

/** "1 member" / "32 members", as the design's meta line reads it (Figma 838:9711). */
export const memberCountLabel = (count: number): string => `${count} ${count === 1 ? 'member' : 'members'}`
