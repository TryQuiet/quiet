import { Base58, KeyMetadata } from '@localfirst/crdx'

export interface StorableKey {
  keyName: string
  key: string | Base58
}

export interface KeysUpdatedEvent {
  keys: StorableKey[]
}

export interface DeviceCredentialsUpdatedEvent {
  deviceId: string
  teamId: string
  /** Base58-encoded 64-byte libsodium Ed25519 signing private key */
  signingPrivateKey: string
}

export interface NseQssUrlUpdatedEvent {
  teamId: string
  qssUrl: string
}

export interface NseSyncTimestampUpdatedEvent {
  teamId: string
  lastSyncTimestamp: number
}
