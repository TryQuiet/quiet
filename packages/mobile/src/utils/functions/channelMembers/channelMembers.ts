import { ChannelType, type UserProfile } from '@quiet/types'

/** The parts of a channel that decide who belongs to it. */
export interface ChannelMembership {
  id: string
  type?: ChannelType
  public?: boolean
  memberIds?: string[]
}

/**
 * Who is in a channel.
 *
 * A DM's membership is the participant list baked into the conversation. A profile carries only
 * the private channels it belongs to, because everyone in the community is in every public one —
 * so a public channel's membership is the whole community.
 *
 * The menu, the top bar and the members list all answer this question, and they must agree. They
 * did not: the list filtered on profile.channels with no public branch, so a public channel showed
 * nobody while the bar above it showed the whole community.
 */
export const getChannelMembers = (
  channel: ChannelMembership | undefined,
  userProfiles: Record<string, UserProfile>
): UserProfile[] => {
  if (channel == null) return []
  const profiles = Object.values(userProfiles)
  if (channel.type === ChannelType.DM) {
    return profiles.filter(profile => channel.memberIds?.includes(profile.userId))
  }
  if (channel.public ?? true) return profiles
  return profiles.filter(profile => profile.channels?.includes(channel.id))
}

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
