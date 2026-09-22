import {
  DisplayableMessage,
  DownloadStatus,
  FileMetadata,
  FilePreviewData,
  MessagesDailyGroups,
  MessageSendingStatus,
  PublicChannel,
  type ChannelType,
  type UserProfile,
} from '@quiet/types'
import { Dictionary } from '@reduxjs/toolkit'
import { useContextMenu } from '../../hooks/useContextMenu'
import { Asset } from 'react-native-image-picker'
import { UserLabelHandlers } from '../UserLabel/UserLabel.types'
import { HeaderTitleProps } from '../Appbar/Appbar.types'
import { type IsUserConnected } from '@quiet/common'

// Define a new type for date groups with timestamps
export interface DateGroup {
  displayDate: string // Displayed date string like "Today", "Yesterday", etc.
  timestamp: number // ISO timestamp for accurate sorting
}

// Define a new type for flattened list items (either a divider or a message group)
export type ListItem =
  | { type: 'divider'; id: string; displayDate: string }
  | {
      type: 'message'
      id: string
      displayDate: string
      messageGroup: DisplayableMessage[]
    }

export interface ChatProps extends UserLabelHandlers {
  contextMenu?: ReturnType<typeof useContextMenu> | null
  sendMessageAction: (message: string) => void
  loadMessagesAction: (load: boolean) => void
  handleBackButton: () => void
  channel?: PublicChannel
  messages?: {
    count: number
    groups: MessagesDailyGroups
  }
  pendingMessages?: Dictionary<MessageSendingStatus>
  downloadStatuses?: Dictionary<DownloadStatus>
  maxAutodownloadSizeBytes?: number
  imagePreview?: FileMetadata | null
  setImagePreview?: (media: FileMetadata | null) => void
  openImagePreview: (media: FileMetadata) => void
  updateImageAttachments: (assets: Asset[]) => void
  removeFilePreview: (id: string) => void
  uploadedFiles?: FilePreviewData
  openUrl: (url: string) => void
  ready?: boolean
  channelName: string
  channelId?: string
  newChat: boolean
  /** Opens a message author's profile. */
  openUserProfile?: (userId: string) => void
  /** Recipients already chosen when the composer opens — a DM started from someone's profile. */
  newChatRecipientIds?: string[]
  userProfiles: Record<string, UserProfile>
  me?: UserProfile
  /** Presence by user id; a linked device counts as the same user. See connection.selectors. */
  isUserConnected: IsUserConnected
  /** My own row follows Tor, since I am not my own peer. */
  isTorInitialized: boolean
  createOrSetDmChannelAction: (memberIds: string[], firstMessage: string) => void
  setDmChannelOnSelection: (selectedIds: string[]) => void
}

export interface ChannelMessagesComponentProps extends UserLabelHandlers {
  day: string
  messages: DisplayableMessage[][]
  pendingMessages?: Dictionary<MessageSendingStatus>
  downloadStatuses?: Dictionary<DownloadStatus>
  openImagePreview: (media: FileMetadata) => void
  openUrl: (url: string) => void
}

export interface ChatAppbarHeaderTitleProps extends HeaderTitleProps {
  isPublic: boolean
  isNewChat: boolean
  channelType: ChannelType
  /** Drawn under the channel name as the design's meta line; omitted when there is no channel. */
  memberCount?: number
  /** Opens the profile of a one-to-one DM's other participant; absent for anything else. */
  openUserProfile?: () => void
}
