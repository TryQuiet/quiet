import { FileMetadata } from '@quiet/state-manager'

export interface UploadedImageProps {
  media: FileMetadata
  openImagePreview: (media: FileMetadata) => void
}
