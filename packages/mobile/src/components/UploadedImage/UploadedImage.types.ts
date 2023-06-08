import { FileMetadata } from '@quiet/types'

export interface UploadedImageProps {
  media: FileMetadata
  openImagePreview: (media: FileMetadata) => void
}
