import type { DmChannelUserData } from '../ProfilePhoto/ProfilePhoto.types'

export interface ChannelMembershipListProps {
  members: DmChannelUserData[] | undefined
  channelId: string
  /** Opens a member's profile. This list only shows who belongs, so a tap has no other meaning —
   *  unlike the add-members list, where a tap selects. */
  openUserProfile?: (userId: string) => void
}
