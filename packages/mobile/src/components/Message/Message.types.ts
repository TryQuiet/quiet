import { DisplayableMessage, DownloadStatus } from '@quiet/state-manager'

export interface MessageProps {
  data: DisplayableMessage[]
  downloadStatus?: DownloadStatus
}
