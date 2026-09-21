import { Community, type UserProfile } from '@quiet/types'
import { useContextMenu } from '../../hooks/useContextMenu'
import { ChannelTileProps } from '../ChannelTile/ChannelTile.types'

export interface AppHomeProps {
  community?: Community
  channelTiles: ChannelTileProps[]
  dmTiles: ChannelTileProps[]
  userProfiles: Record<string, UserProfile>
  me?: UserProfile
  createChannel: () => void
  /** Hide the channel-creation control entirely when the user has no permission to create one. */
  canCreateChannel?: boolean
  createDm: () => void
  communityContextMenu: ReturnType<typeof useContextMenu> | null
}
