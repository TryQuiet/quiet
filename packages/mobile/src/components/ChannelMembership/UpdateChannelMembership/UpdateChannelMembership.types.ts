import { Community, UserProfile } from '@quiet/types'

export interface UpdateChannelMembershipProps {
  channelName: string
  channelId: string
  community?: Community
  userProfiles: Record<string, UserProfile>
  updateChannelMembership: (memberIds: string[]) => void
  handleBackButton: () => void
}
