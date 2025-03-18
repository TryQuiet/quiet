import { type HiddenService, type PeerId, type Identity, type UserCsr } from './identity'
import { InvitationData, InvitationDataV2 } from './network'

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

export enum CommunityOwnership {
  Owner = 'owner',
  User = 'user',
}

export interface CreateNetworkPayload {
  ownership: CommunityOwnership
  name?: string
  inviteData?: InvitationData
}

export interface NetworkInfo {
  hiddenService: HiddenService
  peerId: PeerId
}

export interface Certificates {
  certificate: string
  key: string
  CA: string[]
}

export interface CreateCommunityPayload {
  name: string
}

export interface JoinCommunityPayload {
  inviteData: InvitationData
}

export interface InitCommunityPayload {
  // Used for both joining and creating community
  // Remove redundancy and pass data in inviteData?
  id: string
  name?: string
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

export interface StorePeerListPayload {
  communityId: string
  peerList: string[]
}

export interface UpdatePeerListPayload {
  communityId: string
  peerId: string
}

export interface ResponseCreateCommunityPayload {
  id: string
  payload: Partial<Identity>
}

export interface ResponseLaunchCommunityPayload {
  id: string
}

export interface AddOwnerCertificatePayload {
  communityId: string
  ownerCertificate: string
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
