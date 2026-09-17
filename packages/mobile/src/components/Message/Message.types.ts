import { DisplayableMessage, DownloadStatus, FileMetadata, MessageSendingStatus } from '@quiet/types'
import { Dictionary } from '@reduxjs/toolkit'
import { UserLabelHandlers } from '../UserLabel/UserLabel.types'

export interface MessageProps extends UserLabelHandlers {
  data: DisplayableMessage[]
  pendingMessages?: Dictionary<MessageSendingStatus>
  downloadStatuses?: Dictionary<DownloadStatus>
  maxAutodownloadSizeBytes?: number
  openImagePreview: (media: FileMetadata) => void
  openUrl: (url: string) => void
  /** Opens the author's profile. Absent where a profile cannot be reached, e.g. in Storybook. */
  openUserProfile?: (userId: string) => void
}
