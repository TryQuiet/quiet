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
  registrarUrl?: string
  registrar?: null | {
    privateKey: string
    address: string
  }
  onionAddress?: string
  privateKey?: string
  port?: number
  registrationAttempts?: number
  ownerCertificate?: string
  psk?: string
}

export enum CommunityOwnership {
  Owner = 'owner',
  User = 'user',
}

export interface NetworkData {
  hiddenService: HiddenService
  peerId: PeerId
}

export interface CreateNetworkPayload {
  ownership: CommunityOwnership
  name?: string
  peers?: InvitationPair[]
  psk?: string
}

export interface ResponseCreateNetworkPayload {
  community: Community
  network: NetworkData
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
}

export interface UpdateCommunityPayload {
  rootCa: string
}

export interface LaunchRegistrarPayload {
  id: string
  peerId: string
  rootCertString: string
  rootKeyString: string
  privateKey: string
}

export interface ResponseRegistrarPayload {
  id: string
  payload: Partial<Community>
}

export interface StorePeerListPayload {
  peerList: string[]
}

export interface UpdatePeerListPayload {
  peerId: string
}

export interface ResponseCreateCommunityPayload {
  id: string
  payload: Partial<Identity>
}

export interface ResponseLaunchCommunityPayload {
  id: string
}

export interface UpdateRegistrationAttemptsPayload {
  registrationAttempts: number
}

export interface AddOwnerCertificatePayload {
  ownerCertificate: string
}

export interface CommunityMetadata {
  id: string
  rootCa: string
  ownerCertificate: string
}

export interface CommunityMetadataPayload {
  rootCa: string
  ownerCertificate: string
}
