import { CreateIdentityOptions, IdentitiesType, Identity, KeyStoreType } from '@orbitdb/core'
import { SigChainService } from '../../../../auth/sigchain.service'
import EventEmitter from 'events'
import { Injectable } from '@nestjs/common'
import { LFAIdentity, LFAIdentityMetadata } from './types'
import { LFAIdentityProvider } from './lfa-identity.provider'
import * as uint8arrays from 'uint8arrays'
import { Serializer } from '../../../../common/serializer.service'
import { SerializerEncodingType } from '@quiet/types'

@Injectable()
class LFAIdentities extends EventEmitter {
  constructor(
    private readonly sigchainService: SigChainService,
    private readonly provider: LFAIdentityProvider,
    private readonly serializer: Serializer
  ) {
    super()
  }

  get keystore(): KeyStoreType {
    return {} as any
  }

  public async createIdentity(options: CreateIdentityOptions): Promise<LFAIdentity> {
    if (options.id == null) {
      throw new Error('No ID provided on createIdentity')
    }

    const { user, sigchain } = this.provider.getUserAndChain(
      this.sigchainService.activeChain.context.user.userId,
      this.sigchainService.activeChain.team!.id
    )
    const teamId = sigchain.team!.id
    const identityMetadata: LFAIdentityMetadata = {
      id: user.userId,
      teamId,
      publicKey: user.keys.signature,
      generation: user.keys.generation,
    }
    const identityBytes = this.serializer.serialize(identityMetadata, SerializerEncodingType.UINT8ARRAY)
    const identityHash = uint8arrays.toString(identityBytes, 'hex')
    return {
      id: user.userId,
      generation: user.keys.generation,
      teamId,
      type: this.provider.type,
      provider: this.provider,
      publicKey: user.keys.signature,
      signatures: {
        id: '',
        publicKey: '',
      },
      bytes: identityBytes,
      hash: identityHash,
      sign: this.sign,
      verify: this.verify,
    }
  }

  public async getIdentity(hash: string): Promise<LFAIdentity> {
    const bytes = uint8arrays.fromString(hash, 'hex')
    const identityMetadata = this.serializer.deserialize(bytes) as LFAIdentityMetadata
    this.provider.getUserAndChain(identityMetadata.id, identityMetadata.teamId)
    return {
      id: identityMetadata.id,
      teamId: identityMetadata.teamId,
      generation: identityMetadata.generation,
      type: this.provider.type,
      publicKey: identityMetadata.publicKey,
      signatures: {
        id: '',
        publicKey: '',
      },
      bytes,
      hash,
      sign: this.sign,
      verify: this.verify,
    }
  }

  public async verifyIdentity(identity: LFAIdentity): Promise<boolean> {
    const { user } = this.provider.getUserAndChain(identity.id, identity.teamId, false)
    return true
  }

  public async sign(identity: LFAIdentity, data: string | Uint8Array): Promise<string> {
    return this.provider.signIdentity(identity.id, identity.teamId)
  }

  public async verify(signature: string, publicKey: string, data: string): Promise<boolean> {
    return true
  }
}

export { LFAIdentities }
