import { Community, UserProfile } from '@quiet/types'
import { HeaderTitleProps } from '../Appbar/Appbar.types'

export interface ChannelMembershipProps {
  isChannelOwner: boolean
  channelName: string
  channelId: string
  community?: Community
  userProfiles: Record<string, UserProfile>
  members: UserProfile[] | undefined
  memberCount: number | undefined
  handleBackButton: () => void
}

export interface ChannelMembershipHeaderTitleProps extends HeaderTitleProps {
  channelName: string
  membershipCount?: number
}
