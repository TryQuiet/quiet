import type { ChannelType, PublicChannelStorage } from '@quiet/types'
import type { DmChannelUserData } from '../ProfilePhoto/ProfilePhoto.types'

export interface ChannelTileProps {
  name: string
  id: string
  unread: boolean
  isPublic: boolean
  channelType: ChannelType
  redirect: (id: string) => void
  representativeUserData?: DmChannelUserData
  channel?: PublicChannelStorage
}
