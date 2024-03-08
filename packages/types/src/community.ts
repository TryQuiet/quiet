import { type HiddenService, type PeerId, type Identity } from './identity'
import { InvitationPair } from './network'

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
  privateKey?: string
  port?: number
  ownerCertificate?: string
  psk?: string
  ownerOrbitDbIdentity?: string
}

export enum CommunityOwnership {
  Owner = 'owner',
  User = 'user',
}

export interface CreateNetworkPayload {
  ownership: CommunityOwnership
  name?: string
  peers?: InvitationPair[]
  psk?: string
  ownerOrbitDbIdentity?: string
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

export interface InitCommunityPayload {
  id: string
  peerId: PeerId
  hiddenService: HiddenService
  certs?: Certificates
  peers?: string[]
  psk?: string
  ownerOrbitDbIdentity?: string
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
