import { Base58, KeyMetadata } from '@localfirst/crdx'

export interface KeyWithMetadata {
  scope: KeyMetadata
  key: string | Base58
}

export interface KeysUpdatedEvent {
  secretKeys: KeyWithMetadata[]
  userPublicKeys: KeyWithMetadata[]
  sigKeys: KeyWithMetadata[]
}
