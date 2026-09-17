import { PublicChannelStorage } from '@quiet/types'
import { DmChannelUserData } from '../Sidebar/DirectMessagesPanel/DirectMessagesPanel'

export enum ProfilePhotoSize {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
}

export interface ProfilePhotoWithBadgeProps {
  userData: DmChannelUserData | undefined
  /** Only a DM passes one; it is what turns the presence dot into a group member count. */
  channel?: PublicChannelStorage | undefined
  size?: ProfilePhotoSize
  borderRadius?: number
}
