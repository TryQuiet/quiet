import { Community, UserProfile, type ChannelType } from '@quiet/types'
import { HeaderTitleProps } from '../Appbar/Appbar.types'
import type { DmChannelUserData } from '../ProfilePhoto/ProfilePhoto.types'

export interface ChannelMembershipProps {
  channelTitle: string
  channelName: string
  channelId: string
  channelType: ChannelType
  channelIsPublic?: boolean
  community?: Community
  userProfiles: Record<string, UserProfile>
  members: DmChannelUserData[] | undefined
  memberCount: number | undefined
  canAddMembers: boolean
  handleBackButton: () => void
  /** Opens a member's profile; this list is read-only, so a tap means nothing else here. */
  openUserProfile?: (userId: string) => void
}

export interface ChannelMembershipHeaderTitleProps extends HeaderTitleProps {
  channelTitle: string
  channelType: ChannelType
  /** Public channels take the '#' glyph, private ones the padlock, DMs neither. */
  channelIsPublic?: boolean
  membershipCount?: number
}

/**
 * The read-only member row (Figma PVQ1Kjf6Cq8ng1czuVtvR8, "User row" 5057:15992): 12 above and
 * below a 32pt avatar. The design's 88 includes a second line of role stickers, which do not exist
 * here.
 */
export const USER_ROW_HEIGHT = 56

/** The pickable member row (838:9311): 11 above and below the same avatar. */
export const SELECTABLE_USER_ROW_HEIGHT = 54
