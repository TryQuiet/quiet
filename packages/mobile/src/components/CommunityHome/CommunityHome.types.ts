import type { FileMetadata } from '@quiet/types'

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
 * One member row in the Members section: someone in the community, as the
 * design's `List item--people` draws them.
 */
export interface CommunityHomeUser {
  userId: string
  nickname: string
  /** Base64 photo (legacy profiles). */
  photo?: string
  profilePhoto?: FileMetadata
  /**
   * Whether this member is reachable right now, for the avatar's presence
   * badge. Undefined before presence is known, which draws no badge.
   */
  connected?: boolean
  /** You are in the community's member list, and are labelled as such. */
  isMe?: boolean
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
  /**
   * Opens the direct message with this member, or the composer with them
   * already chosen when there is no conversation yet.
   */
  openMember: (userId: string) => void
  /**
   * Opens the composer with nobody chosen yet, for a conversation with someone not on this list —
   * the plus on the Direct messages title. Starting a conversation is not a permission anyone can
   * be without, so unlike `createChannel` this is never withheld.
   */
  startDm: () => void
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
  /** Opens (or starts) the direct message with this member. */
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
