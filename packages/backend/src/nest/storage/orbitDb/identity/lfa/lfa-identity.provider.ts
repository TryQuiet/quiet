/**
 * OrbitDB identity provider that uses LFA for verification/signing rather than the standard
 * OrbitDB model of identity.
 *
 * NOTE: This doesn't store ANY identity data in OrbitDB, all identification is handled
 * ad hoc using the sigchain.
 */

import { IdentityProvider } from '@orbitdb/core'
import { LFA_IDENTITY_PROVIDER_TYPE } from './const'
import { Injectable } from '@nestjs/common'
import { SigChainService } from '../../../../auth/sigchain.service'
import {
  LFAIdentity,
  LFAIdentityProviderGetIdError,
  LFAIdentityProviderSignError,
  LFAIdentityProviderVerifyError,
  LFAUserAndChain,
} from './types'
import { Member } from '@localfirst/auth'
import { hash } from '@localfirst/crypto'
import { createLogger } from '../../../../common/logger'

@Injectable()
class LFAIdentityProvider implements IdentityProvider {
  private readonly logger = createLogger('orbitdb:identity:lfa:provider')

  constructor(private readonly sigchainService: SigChainService) {}

  /**
   * Type of the identity provider
   */
  get type(): string {
    return LFA_IDENTITY_PROVIDER_TYPE
  }

  /**
   * Verify and return the user ID from the sigchain
   *
   * @param userId LFA user ID
   * @param teamId LFA team ID
   * @returns User ID that is verified to be on the chain
   */
  public async getId(userId: string, teamId: string): Promise<string> {
    try {
      const { user } = this.getUserAndChain(userId, teamId)
      return user!.userId
    } catch (e) {
      throw new LFAIdentityProviderGetIdError(e)
    }
  }

  /**
   * Generate a signature using your user's keys from the sigchain
   *
   * @param userId LFA user ID
   * @param teamId LFA team ID
   * @returns Signature generated using this user's keys
   */
  public async signIdentity(userId: string, teamId: string): Promise<string> {
    try {
      const { user, sigchain } = this.getUserAndChain(userId, teamId)
      const userFromContext = sigchain.context.user
      if (userFromContext.userId !== user.userId || userFromContext.keys.signature.publicKey != user.keys.signature) {
        throw new Error('User ID and/or public signing key does not match context user')
      }
      const signaturePayload = this._generateIdentitySignaturePayload(user)
      const signedEnvelope = sigchain.crypto.sign(signaturePayload)
      return signedEnvelope.signature
    } catch (e) {
      throw new LFAIdentityProviderSignError(e)
    }
  }

  /**
   * Validate a given identity from OrbitDB against the sigchain
   *
   * @param identity LFAIdentity object to be verified
   * @returns True if the identity matches what is on the sigchain
   */
  public async verifyIdentity(identity: LFAIdentity): Promise<boolean> {
    try {
      this.getUserAndChain(identity.id, identity.teamId)
      return true
    } catch (e) {
      const err = new LFAIdentityProviderVerifyError(e)
      this.logger.error('Error while verifying OrbitDB identity with LFA', err)
      return false
    }
  }

  /**
   * Validate a user is on the sigchain given a user ID and return the user record and chain
   *
   * @param userId LFA user ID
   * @param teamId LFA team ID
   * @param includeRemoved Include user record even if user is removed
   * @returns User and sigchain
   */
  public getUserAndChain(userId: string, teamId: string, includeRemoved: boolean = false): LFAUserAndChain {
    const sigchain = this.sigchainService.getChain({ teamId }, true)
    const user = sigchain.users.getUserById(userId, { includeRemoved, throwOnMissing: true })
    return {
      user: user!,
      sigchain,
    }
  }

  /**
   * Generate a reproducible signature for a given user's keys
   *
   * @param user User record from sigchain
   * @returns Payload string for signing
   */
  private _generateIdentitySignaturePayload(user: Member): string {
    return hash(user.userId, user.keys.signature)
  }
}

export { LFAIdentityProvider }
