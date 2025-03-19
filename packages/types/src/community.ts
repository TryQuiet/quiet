import { type Identity } from './identity'
import { InvitationData } from './network'

// ----- Base Types -----

export interface Community {
  id: string
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
  ownership: CommunityOwnership
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
}

export interface JoinCommunityPayload {
  inviteData: InvitationData
}

export interface LaunchCommunityPayload {
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
}

export interface ResponseLaunchCommunityPayload {
  id: string
}
export interface ResponseCreateCommunityPayload {
  id: string
  community: Community
  identity: Identity
}

export interface ResponseJoinCommunityPayload {
  id: string
  community: Community
  identity: Identity
}

// ----- deprecated -----
export interface Certificates {
  certificate: string
  key: string
  CA: string[]
}
