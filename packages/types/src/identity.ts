/*
  Interfaces related to the local users identity
*/
export interface HiddenService {
  onionAddress: string
  privateKey: string
}

export interface PeerId {
  id: string
  privKey: string
  noiseKey?: string
}

export interface NetworkInfo {
  hiddenService: HiddenService
  peerId: PeerId
}

export interface Identity {
  communityId: string
  userId: string
  networkInfo: NetworkInfo
  joinTimestamp: number | null
  // When a user first joins a community, they send a message
  // introducing themselves.
  introMessageSent?: boolean
}

export interface IdentityUpdatePayload {
  id: string
  nickname?: string
  hiddenService?: HiddenService
  joinTimestamp?: number | null
  introMessageSent?: boolean
}
export interface UpdateJoinTimestampPayload {
  communityId: string
}

export interface RegisterUsernamePayload {
  nickname: string
  isUsernameTaken?: boolean
}
