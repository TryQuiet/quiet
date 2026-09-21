import { type UserProfile } from '@quiet/types'

export interface UserProfileProps {
  profile: UserProfile | undefined
  /** Your own profile also offers the way to change your photo. */
  isMe: boolean
  handleBackButton: () => void
  /** Opens the DM with this person — with yourself, that is a note to self. */
  handleMessage: () => void
  /** Picks a new profile photo; only your own profile can be edited. */
  handleEditPhoto?: () => void
}
