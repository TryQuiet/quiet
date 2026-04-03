import { Community, UserProfile } from '@quiet/types'
import { HeaderTitleProps } from '../Appbar/Appbar.types'

export interface ChannelMembershipProps {
  channelName: string
  channelId: string
  community?: Community
  userProfiles?: Record<string, UserProfile>
  updateChannelMembership: (memberIds: string[]) => void
  handleBackButton: () => void
}

export interface ChannelMembershipHeaderTitleProps extends HeaderTitleProps {
  channelName: string
}
