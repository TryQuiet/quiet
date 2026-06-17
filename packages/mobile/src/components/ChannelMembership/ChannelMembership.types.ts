import { Community, UserProfile, type ChannelType } from '@quiet/types'
import { HeaderTitleProps } from '../Appbar/Appbar.types'

export interface ChannelMembershipProps {
  channelTitle: string
  channelName: string
  channelId: string
  channelType: ChannelType
  community?: Community
  userProfiles: Record<string, UserProfile>
  members: UserProfile[] | undefined
  memberCount: number | undefined
  handleBackButton: () => void
}

export interface ChannelMembershipHeaderTitleProps extends HeaderTitleProps {
  channelTitle: string
  channelType: ChannelType
  membershipCount?: number
}

export const USER_ROW_HEIGHT = 60
