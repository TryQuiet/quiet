import { ChannelType, type UserProfile } from '@quiet/types'

import { isDefined } from './helpers'

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
 * Every surface that shows a channel's members or their count must answer through here. They used
 * to each carry a copy, and the desktop channel header's copy read memberIds — which only a DM has —
 * and fell back to the whole community, so a private channel claimed everyone as a member.
 */
export const getChannelMembers = (
  channel: ChannelMembership | undefined,
  userProfiles: Record<string, UserProfile>
): UserProfile[] => {
  if (channel == null) return []
  if (channel.type === ChannelType.DM) {
    // In participant order, which the DM header's avatars follow; a participant whose profile has
    // not arrived yet is left out rather than drawn blank.
    return [...new Set(channel.memberIds ?? [])].map(id => userProfiles[id]).filter(isDefined)
  }
  const profiles = Object.values(userProfiles)
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
