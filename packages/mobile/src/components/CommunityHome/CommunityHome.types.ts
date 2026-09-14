import { FileMetadata } from '@quiet/types'

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

/** One member row in the Users section. */
export interface CommunityHomeUser {
  userId: string
  nickname: string
  /** Base64 photo (legacy profiles). */
  photo?: string
  profilePhoto?: FileMetadata
}

export interface CommunityHomeProps {
  /** Community name shown in the title bar; its initial fills the icon tile. */
  communityName: string
  channels: CommunityHomeChannel[]
  users: CommunityHomeUser[]
  /** The generic public-channel create permission, same as the context menu's. */
  canCreateChannel: boolean
  /** Opens the community context menu (linked devices, leave, share logs). */
  openCommunityMenu: () => void
  /** Opens the existing invitation flow. */
  addMembers: () => void
  /** Opens the existing create-channel screen. */
  createChannel: () => void
  openChannel: (id: string) => void
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
  user: CommunityHomeUser
  testID?: string
}

export interface CommunityIconProps {
  /** Community name; the first character fills the tile. */
  name: string
  size: number
  /** Shows the unread dot when any channel in the community is unread. */
  unread?: boolean
}
