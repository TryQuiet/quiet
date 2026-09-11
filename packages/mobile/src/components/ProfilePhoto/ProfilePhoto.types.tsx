import { FileMetadata, type PublicChannelStorage, type UserProfile } from '@quiet/types'

export interface ProfilePhotoProps {
  username: string
  userId: string
  photo?: string
  profilePhoto?: FileMetadata
  alt?: string
  size?: number
  borderRadius?: number
}

export enum ProfilePhotoSize {
  SMALL = 'small',
  MEDIUM_SMALL = 'mediumSmall',
  MEDIUM = 'medium',
  LARGE = 'large',
}

export interface ProfilePhotoWithBadgeProps {
  userData: DmChannelUserData | undefined
  channel?: PublicChannelStorage
  size?: ProfilePhotoSize
  photoBorderRadius?: number
  badgeBorderColor?: string
}

export interface DmChannelUserData {
  connected: boolean | undefined
  user: UserProfile
}
