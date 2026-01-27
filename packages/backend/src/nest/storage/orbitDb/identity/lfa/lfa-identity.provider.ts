import { Identity, IdentityProvider } from '@orbitdb/core'
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

  get type(): string {
    return LFA_IDENTITY_PROVIDER_TYPE
  }

  public async getId(userId: string, teamId: string): Promise<string> {
    try {
      const { user } = this.getUserAndChain(userId, teamId)
      return user!.userId
    } catch (e) {
      throw new LFAIdentityProviderGetIdError(e)
    }
  }

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

  public getUserAndChain(userId: string, teamId: string, includeRemoved: boolean = false): LFAUserAndChain {
    const sigchain = this.sigchainService.getChain({ teamId }, true)
    const user = sigchain.users.getUserById(userId, { includeRemoved, throwOnMissing: true })
    return {
      user: user!,
      sigchain,
    }
  }

  private _generateIdentitySignaturePayload(user: Member): string {
    return hash(user.userId, user.keys.signature)
  }
}

export { LFAIdentityProvider }
