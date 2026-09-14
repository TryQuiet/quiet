import { InviteeDeviceContext, Keyring, LocalUserContext } from '@localfirst/auth'
import type { SigChain } from './sigchain'

export type PendingDeviceAdmission = {
  teamId: string
  userId: string
}

export type DeviceAdmissionResult = {
  selected: boolean
  completion: Promise<SigChain>
}

export type DeviceAdmissionCompletionState = {
  cancelled: boolean
  completion: Promise<SigChain>
}

export type SigChainSaveData = {
  serializedTeam: string | undefined
  localUserContext?: LocalUserContext
  inviteeDeviceContext?: InviteeDeviceContext
  pendingDeviceAdmission?: PendingDeviceAdmission
  teamKeyRing: Keyring | undefined
}

export type SerializedSigChain = {
  serializedTeam: Uint8Array | undefined
  localUserContext?: LocalUserContext
  inviteeDeviceContext?: InviteeDeviceContext
  pendingDeviceAdmission?: PendingDeviceAdmission
  teamKeyRing: Keyring | undefined
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
  DEVICE_ADMITTED = 'deviceAdmitted',
}

export enum StoredKeyType {
  SECRET = 'secret',
  USER_PUBLIC = 'userPublic',
  USER_SIG = 'userSig',
}

export const RANDOM_TEAM_NAME_LENGTH = 32
