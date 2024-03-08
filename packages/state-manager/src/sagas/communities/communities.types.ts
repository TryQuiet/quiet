import { type Community, type HiddenService, type Identity, type PeerId } from '@quiet/types'

// TODO: Remove this file in favor of @quiet/types

export enum CommunityOwnership {
  Owner = 'owner',
  User = 'user',
}

export interface CreateNetworkPayload {
  ownership: CommunityOwnership
  name?: string
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
  certs: Certificates
  peers?: string[]
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
