import { FileMetadata } from '@quiet/types'

export interface ImageAttachmentProps {
  media: FileMetadata
  openImageAttachmentPreview: (media: FileMetadata) => void
}
