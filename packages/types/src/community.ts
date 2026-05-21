import { Base58, InviteResult } from '3rd-party/auth/packages/auth/dist'
import { type Identity } from './identity'
import { InvitationData } from './network'
import { User, UserProfile } from './user'

// ----- Base Types -----

export interface Community {
  id: string
  ownership: CommunityOwnership
  name?: string
  CA?: null | {
    rootCertString: string
    rootKeyString: string
  }
  rootCa?: string
  peerList?: string[]
  onionAddress?: string
  ownerCertificate?: string
  psk?: string
  inviteData?: InvitationData | null
  ownerOrbitDbIdentity?: string
  teamId?: string
  qssEnabled?: boolean
  qssEndpoint?: string
  tosAccepted?: boolean
  qssSetup?: boolean
}

export interface CommunityMetadata {
  id: string
  // Perhaps we should rename this to rootCertificate? When I think of
  // certificate authority, I think of the owner themselves.
  rootCa: string
  ownerCertificate: string
  // Owner's OrbitDB identity
  ownerOrbitDbIdentity?: string
}

export enum CommunityOwnership {
  Owner = 'owner',
  User = 'user',
}

// ----- Frontend Payloads -----

export interface CreateCommunityPayload {
  name: string
  useServer?: boolean
}

export interface JoinCommunityPayload {
  inviteData: InvitationData
}

export interface LaunchCommunityPayload {
  id: string
}

export interface LeaveCommunityPayload {
  id: string
}

// ----- State-Manager <-> Backend Payloads -----
export interface InitCommunityPayload {
  id: string
  name: string
  CA?: null | {
    rootCertString: string
    rootKeyString: string
  }
  rootCa?: string
  peers?: string[]
  psk?: string
  ownerOrbitDbIdentity?: string
  inviteData?: InvitationData | null
  username: string
  useServer?: boolean
  tosAccepted?: boolean
}

export interface UpdateCommunityPayload {
  id: string
  updates: Partial<Omit<Community, 'id'>>
}

export interface ResponseLaunchCommunityPayload {
  id: string
}
export interface ResponseCreateCommunityPayload {
  id: string
  community: Community
  identity: Identity
  profile: UserProfile
}

export interface ResponseJoinCommunityPayload {
  id: string
  community: Community
  identity: Identity
  profile: UserProfile
}

export interface ResponseLeaveCommunityPayload {
  id: string
}

// ----- Invites -----
export interface RequestInvitePayload {
  id: Base58 | undefined
}

export interface InviteResultWithSalt extends InviteResult {
  salt: string
}

export interface ResponseInvitePayload {
  valid: boolean
  newInvite?: InviteResultWithSalt
}

// ----- deprecated -----
export interface Certificates {
  certificate: string
  key: string
  CA: string[]
}
