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

/**
 * Native LFA Events
 */
export enum LFAEvents {
  UPDATED = 'updated',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  JOINED = 'joined',
  CHANGE = 'change',
  LOCAL_ERROR = 'localError',
  REMOTE_ERROR = 'remoteError',
}

/**
 * Events emitted by Sigchains and the SigchainService
 */
export enum SigchainEvents {
  UPDATED = 'sigchainUpdated',
}

export enum StoredKeyType {
  SECRET = 'secret',
  USER_PUBLIC = 'userPublic',
  USER_SIG = 'userSig',
}
