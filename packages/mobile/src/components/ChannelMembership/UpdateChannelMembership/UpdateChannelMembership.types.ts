import { Community, UserProfile, type ChannelType } from '@quiet/types'

export interface UpdateChannelMembershipProps {
  channelTitle: string
  channelId: string
  channelName: string
  channelType: ChannelType
  community?: Community
  userProfiles: Record<string, UserProfile>
  updateChannelMembership: (memberIds: string[]) => void
  handleBackButton: () => void
}
