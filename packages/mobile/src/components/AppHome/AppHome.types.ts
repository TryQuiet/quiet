import { Community, type UserProfile } from '@quiet/types'
import { useContextMenu } from '../../hooks/useContextMenu'
import { ChannelTileProps } from '../ChannelTile/ChannelTile.types'

export type PartialChannelTileProps = Omit<ChannelTileProps, 'userProfiles' | 'me'>

export interface AppHomeProps {
  community?: Community
  channelTiles: PartialChannelTileProps[]
  dmTiles: PartialChannelTileProps[]
  userProfiles: Record<string, UserProfile>
  me?: UserProfile
  createChannel: () => void
  createDm: () => void
  communityContextMenu: ReturnType<typeof useContextMenu> | null
}
