import { Base58, Member } from '3rd-party/auth/packages/auth/dist'
import { Identity } from '@orbitdb/core'
import { CompoundError } from '@quiet/types'
import { SigChain } from 'packages/backend/src/nest/auth/sigchain'

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
