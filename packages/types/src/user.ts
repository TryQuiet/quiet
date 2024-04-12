export interface UserData {
  username: string
  onionAddress: string
  peerId: string
}

export interface User extends UserData {
  isRegistered: boolean
  isDuplicated: boolean
  pubKey: string
}

export interface UserProfileData {
  photo: string // base64 encoded image
}

export interface UserProfile {
  profile: UserProfileData
  profileSig: string
  pubKey: string
}

export interface UserProfilesStoredEvent {
  profiles: UserProfile[]
}

export interface SendCertificatesResponse {
  certificates: string[]
}

export interface SendCsrsResponse {
  csrs: string[]
}
