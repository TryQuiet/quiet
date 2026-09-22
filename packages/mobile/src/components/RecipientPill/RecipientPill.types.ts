import { FileMetadata } from '@quiet/types'

export interface RecipientPillProps {
  label: string
  userId: string
  photo?: string
  profilePhoto?: FileMetadata
  onRemove: () => void
  testID?: string
}
