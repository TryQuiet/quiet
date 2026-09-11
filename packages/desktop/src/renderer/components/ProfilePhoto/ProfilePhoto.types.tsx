import { PublicChannelStorage } from '@quiet/types'
import { DmChannelUserData } from '../Sidebar/DirectMessagesPanel/DirectMessagesPanel'

export enum ProfilePhotoSize {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
}

export interface ProfilePhotoWithBadgeProps {
  userData: DmChannelUserData | undefined
  channel: PublicChannelStorage | undefined
  size?: ProfilePhotoSize
  borderRadius?: number
}
