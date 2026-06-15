import { Community } from '@quiet/types'
import { useContextMenu } from '../../hooks/useContextMenu'
import { ChannelTileProps } from '../ChannelTile/ChannelTile.types'

export interface AppHomeProps {
  community?: Community
  channelTiles: ChannelTileProps[]
  dmTiles: any[]
  createChannel: () => void
  createDm: () => void
  communityContextMenu: ReturnType<typeof useContextMenu> | null
}
