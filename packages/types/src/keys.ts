import { Base58, KeyMetadata } from '@localfirst/crdx'

export interface StorableKey {
  keyName: string
  key: string | Base58
}

export interface KeysUpdatedEvent {
  keys: StorableKey[]
}
