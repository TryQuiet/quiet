import { KeyMetadata } from '@localfirst/crdx/'
import { Base58 } from '@localfirst/auth'

export enum EncryptionScopeType {
  ROLE = 'ROLE',
  CHANNEL = 'CHANNEL',
  USER = 'USER',
  TEAM = 'TEAM',
}

export type EncryptionScope = {
  type: EncryptionScopeType
  name?: string
}

export type EncryptionScopeDetail = EncryptionScope & {
  generation: number
}

export type EncryptedPayload = {
  contents: Uint8Array
  scope: EncryptionScopeDetail
}

export type EncryptedAndSignedPayload = {
  encrypted: EncryptedPayload
  signature: Signature
  ts: number
  userId: string
}

export type DecryptedPayload<T> = {
  contents: T
  isValid: boolean
}

export type Signature = {
  signature: Base58
  author: KeyMetadata
}
