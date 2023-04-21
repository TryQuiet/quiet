import { Community } from '@quiet/state-manager'
import { useContextMenu } from '../../hooks/useContextMenu'
import { ChannelTileProps } from '../ChannelTile/ChannelTile.types'

export interface ChannelListProps {
  community: Community
  tiles: ChannelTileProps[]
  communityContextMenu: ReturnType<typeof useContextMenu>
  enableDeletion?: boolean
}
