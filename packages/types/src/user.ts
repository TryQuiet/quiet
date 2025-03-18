export interface UserData {
  username: string
  onionAddress: string
  peerId: string
}

export interface User extends UserData {
  isRegistered: boolean
  isDuplicated: boolean
  userId: string
}

export interface UserProfileDisplayData {
  photo?: string // base64 encoded image
  nickname: string
  bio?: string
}

export interface UserProfile {
  profile: UserProfileDisplayData
  profileSig?: string // deprecated
  userId: string
}

export interface UserProfilesStoredEvent {
  profiles: UserProfile[]
}

export interface UsersUpdatedEvent {
  users: User[]
}

export interface SendCertificatesResponse {
  certificates: string[]
}

export interface SendCsrsResponse {
  csrs: string[]
}
