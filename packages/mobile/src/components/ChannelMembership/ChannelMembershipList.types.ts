import type { DmChannelUserData } from '../ProfilePhoto/ProfilePhoto.types'

export interface ChannelMembershipListProps {
  members: DmChannelUserData[] | undefined
  channelId: string
}
