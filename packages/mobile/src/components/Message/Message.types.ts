import { DisplayableMessage, DownloadStatus, FileMetadata, MessageSendingStatus } from '@quiet/types'
import { Dictionary } from '@reduxjs/toolkit'
import { UserLabelHandlers } from '../UserLabel/UserLabel.types'

export interface MessageProps extends UserLabelHandlers {
  data: DisplayableMessage[]
  pendingMessages?: Dictionary<MessageSendingStatus>
  downloadStatus?: DownloadStatus
  openImagePreview: (media: FileMetadata) => void
  openUrl: (url: string) => void
  ownerNickname: string | null | undefined
}
