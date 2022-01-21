import { createRootCA } from '@zbayapp/identity'
import { AsyncReturnType } from '../../utils/types/AsyncReturnType.interface'
import { HiddenService, Identity, PeerId } from '../identity/identity.types'
import { Community } from './communities.slice'

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

export interface AddNewCommunityPayload {
  id: string
  name: string
  CA: AsyncReturnType<typeof createRootCA> | {}
  registrarUrl: string
}

export interface LaunchRegistrarPayload {
  id: string
  peerId: string
  rootCertString: string
  rootKeyString: string
  privateKey?: string
  port?: number
}

export interface ResponseRegistrarPayload {
  id: string
  payload: Partial<Community>
}

export interface StorePeerListPayload {
  communityId: string
  peerList: string[]
}

export interface ResponseCreateCommunityPayload {
  id: string
  payload: Partial<Identity>
}

export interface ResponseLaunchCommunityPayload {
  id: string
}
