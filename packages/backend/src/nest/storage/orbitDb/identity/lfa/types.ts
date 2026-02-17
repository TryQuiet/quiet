import { Base58, Member, SignedEnvelope } from '@localfirst/auth'
import { Identity } from '@orbitdb/core'
import { CompoundError } from '@quiet/types'
import { SigChain } from '../../../../auth/sigchain'
import { Signature } from '../../../../auth/services/crypto/types'

export type LFAIdentity = Omit<Identity, 'sign'> & {
  teamId: string
  generation: number
  sign: (identity: LFAIdentity, data: string | Uint8Array) => Promise<string>
}

export interface LFAUserAndChain {
  user: Member
  sigchain: SigChain
}

export interface LFAIdentityMetadata {
  id: string
  teamId: string
  publicKey: Base58
  generation: number
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
