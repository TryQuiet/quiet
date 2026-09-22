import { Base58, Member, SignedEnvelope } from '@localfirst/auth'
import { Identity } from '@orbitdb/core'
import { CompoundError } from '@quiet/types'
import { SigChain } from '../../../../auth/sigchain'
import { Signature } from '../../../../auth/services/crypto/types'

/**
 * An OrbitDB identity backed by LFA. `id` is the LFA user ID (what access controllers authorize
 * against); `deviceId` and `publicKey` name the user's device and its signing key (what the entry
 * signature verifies against). Device keys never rotate and a device belongs to one user for the
 * life of the team, so no key history is needed to check an old entry.
 */
export type LFAIdentity = Omit<Identity, 'sign'> & {
  teamId: string
  deviceId: string
  sign: (identity: LFAIdentity, data: string | Uint8Array) => Promise<string>
}

export interface LFAUserAndChain {
  user: Member
  sigchain: SigChain
}

/** The fields serialized into `entry.identity`. */
export interface LFAIdentityMetadata {
  id: string
  deviceId: string
  teamId: string
  publicKey: Base58
}

export type SignedEnvelopeWithTeamId = {
  teamId: string
} & SignedEnvelope

export type SignatureWithTeamId = {
  teamId: string
} & Signature

export class LFAIdentityProviderGetIdError extends CompoundError<Error> {
  constructor(public readonly originalError?: Error) {
    super(LFAIdentityProviderGetIdError._generateMessage(), originalError)
  }

  private static _generateMessage(): string {
    return `Error getting ID from LFAIdentityProvider`
  }
}

export class LFAIdentityProviderSignError extends CompoundError<Error> {
  constructor(public readonly originalError?: Error) {
    super(LFAIdentityProviderSignError._generateMessage(), originalError)
  }

  private static _generateMessage(): string {
    return `Error signing identity with LFAIdentityProvider`
  }
}

export class LFAIdentityProviderVerifyError extends CompoundError<Error> {
  constructor(public readonly originalError?: Error) {
    super(LFAIdentityProviderVerifyError._generateMessage(), originalError)
  }

  private static _generateMessage(): string {
    return `Error verifying identity with LFAIdentityProvider`
  }
}
