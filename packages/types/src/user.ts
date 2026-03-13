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
  photo?: string // base64 encoded image (legacy)
  profilePhoto?: FileMetadata
  nickname: string
  bio?: string
}

export interface UserProfile {
  userId: string
  nickname: string
  photo?: string // base64 encoded image (legacy)
  fileMetadata?: FileMetadata
  bio?: string
  userData?: UserData
  profilePhoto?: FileMetadata
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

export interface UserProfilesUpdatedPayload {
  new: UserProfile[]
  updates: UserProfile[]
}

export interface UsersUpdatedEvent {
  users: User[]
}

export interface UsersRemovedEvent {
  users: User[]
}
