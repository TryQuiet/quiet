import { Community } from '@quiet/state-manager'
import { ChannelTileProps } from '../ChannelTile/ChannelTile.types'

export interface ChannelListProps {
  community: Community
  tiles: ChannelTileProps[]
}
