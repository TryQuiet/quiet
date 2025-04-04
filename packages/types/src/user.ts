export interface UserData {
  onionAddress: string
  peerId: string
}

export interface User extends UserData {
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
  photo?: string // base64 encoded image
  nickname: string
  bio?: string
  userId: string
}

//The payload for the SET_USER_PROFILE socket action.
export interface SetUserProfilePayload {
  profile: UserProfile
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

export interface SendCertificatesResponse {
  certificates: string[]
}

export interface SendCsrsResponse {
  csrs: string[]
}
