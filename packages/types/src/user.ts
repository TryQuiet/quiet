import { FileMetadata } from './files'

export interface UserData {
  onionAddress: string
  peerId: string
}

export interface User {
  isRegistered: boolean
  isDuplicated: boolean
  roles?: string[]
  userId: string
}

export interface UserProfileDisplayData {
  photo?: string // base64 encoded image
  nickname: string
  bio?: string
}

export interface UserProfile {
  userId: string
  nickname: string
  /**
   * @deprecated Use photoFile instead. This field is maintained for backward compatibility
   * during migration from base64 to IPFS storage. New profile photos should use photoFile.
   */
  photo?: string
  photoFile?: FileMetadata // IPFS CID reference to profile photo
  fileMetadata?: FileMetadata
  bio?: string
  userData?: UserData
}

// ----
// redux action payloads
// ----
export interface SaveUserProfileActionPayload {
  photo?: File
  bio?: string
  nickname?: string
}

export interface DeleteUserProfileActionPayload {
  userId: string
}

// ----
// socket payloads
// ----

export interface SetUserProfilePayload {
  profile: UserProfile
}

export interface SetUserProfileResponse {
  success: boolean
  error?: string
}

export interface UserProfilesStoredEvent {
  profiles: UserProfile[]
}

export interface UsersUpdatedEvent {
  users: User[]
}

export interface UsersRemovedEvent {
  users: User[]
}
