import { Keyring, LocalUserContext, Context } from '@localfirst/auth'

export type SigChainSaveData = {
  serializedTeam: string | undefined
  localUserContext: LocalUserContext
  context?: Context
  teamKeyRing: Keyring | undefined
}

export type SerializedSigChain = {
  serializedTeam: Uint8Array | undefined
  localUserContext: LocalUserContext
  teamKeyRing: Keyring | undefined
}

export type GetChainFilter = {
  teamId?: string
  teamName?: string
}

export enum StoredKeyType {
  SECRET = 'secret',
  USER_PUBLIC = 'userPublic',
  USER_SIG = 'userSig',
}
