import { UserProfile } from '@quiet/types'

export interface ChannelMembershipListProps {
  members: UserProfile[] | undefined
  channelId: string
}
