import type { PublicChannelStorage } from '@quiet/types'

import type { DmChannelUserData } from '../ProfilePhoto/ProfilePhoto.types'

/** One channel row in the Channels section. */
export interface CommunityHomeChannel {
  id: string
  name: string
  /** Public channels get the `#` glyph, private ones the padlock. */
  isPublic: boolean
  /**
   * Whether the channel has messages the user has not seen. Quiet stores unread
   * as a flag, not a count, so the row shows a dot rather than the design's
   * numbered badge.
   */
  unread: boolean
}

/**
 * One conversation row in the Direct messages section: a direct-message channel
 * the user can open, with the other person's profile behind the avatar.
 */
export interface CommunityHomeConversation {
  /** The DM channel's id; opening the row opens this channel. */
  id: string
  /** The other person's name, as the channel displays it. */
  name: string
  unread: boolean
  /** Drives the avatar and its presence badge. */
  userData?: DmChannelUserData
  channel: PublicChannelStorage
  /** A conversation with yourself is labelled, as the channel list labels it. */
  isMe?: boolean
}

export interface CommunityHomeProps {
  /** Community name shown in the title bar; its initial fills the icon tile. */
  communityName: string
  channels: CommunityHomeChannel[]
  conversations: CommunityHomeConversation[]
  /** The generic public-channel create permission, same as the context menu's. */
  canCreateChannel: boolean
  /** Opens the community context menu (linked devices, leave, share logs). */
  openCommunityMenu: () => void
  /** Opens the existing invitation flow. */
  addMembers: () => void
  /** Opens the existing create-channel screen. */
  createChannel: () => void
  /** Starts a new direct message (an empty conversation). */
  createDm: () => void
  openChannel: (id: string, newChat?: boolean) => void
}

export interface ListRowProps {
  label: string
  icon: React.ReactNode
  onPress: () => void
  unread?: boolean
  testID?: string
  accessibilityLabel?: string
}

export interface ListSectionTitleProps {
  title: string
  /** Renders the circled plus at the end of the title when given. */
  onAdd?: () => void
  addAccessibilityLabel?: string
  addTestID?: string
  testID?: string
}

export interface PersonRowProps {
  conversation: CommunityHomeConversation
  /** Opens the conversation. */
  onPress: () => void
  testID?: string
}

export interface CommunityIconProps {
  /** Community name; the first character fills the tile. */
  name: string
  size: number
  /** Shows the unread dot when any channel in the community is unread. */
  unread?: boolean
}
