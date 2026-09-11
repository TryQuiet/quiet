import { Community, UserProfile, type ChannelType } from '@quiet/types'
import type { DmChannelUserData } from '../../ProfilePhoto/ProfilePhoto.types'

export interface UpdateChannelMembershipProps {
  channelTitle: string
  channelId: string
  channelName: string
  channelType: ChannelType
  community?: Community
  nonMembers: Record<string, DmChannelUserData>
  updateChannelMembership: (memberIds: string[]) => void
  handleBackButton: () => void
}
