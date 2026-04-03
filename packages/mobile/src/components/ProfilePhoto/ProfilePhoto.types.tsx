import { FileMetadata } from '@quiet/types'

export interface ProfilePhotoProps {
  username: string
  userId: string
  photo?: string
  profilePhoto?: FileMetadata
  alt?: string
  size?: number
}
