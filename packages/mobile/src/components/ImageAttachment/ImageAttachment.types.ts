import { FileMetadata } from '@quiet/types'

export interface ImageAttachmentProps {
  media: FileMetadata
  openImagePreview: (media: FileMetadata) => void
}
