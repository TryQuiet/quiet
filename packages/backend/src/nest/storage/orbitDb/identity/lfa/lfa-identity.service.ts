/**
 * OrbitDB identity service that uses LFA for verification/signing rather than the standard
 * OrbitDB model of identity.
 *
 * NOTE: This doesn't store ANY identity data in OrbitDB, all identification is handled
 * ad hoc using the sigchain.
 */

import { CreateIdentityOptions, KeyStoreType } from '@orbitdb/core'
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
  private readonly lfaKeyStore: KeyStoreType = {
    clear: async () => {},
    close: async () => {},
    hasKey: async () => false,
    addKey: async () => {
      throw new Error('OrbitDB keystore operations are unsupported for LFA identities')
    },
    createKey: async () => {
      throw new Error('OrbitDB keystore operations are unsupported for LFA identities')
    },
    getKey: async () => undefined,
    getPublic: () => {
      throw new Error('OrbitDB keystore operations are unsupported for LFA identities')
    },
  }

  constructor(
    private readonly sigchainService: SigChainService,
    private readonly provider: LFAIdentityProvider,
    private readonly serializer: Serializer
  ) {
    super()
  }

  /**
   * OrbitDB expects custom identity services to expose a keystore-like object and
   * closes it during shutdown. LFA identities do not persist OrbitDB signing keys,
   * so this is a minimal compatibility shim rather than a real key store.
   */
  get keystore(): KeyStoreType {
    return this.lfaKeyStore
  }

  /**
   * "Create" an identity for use in OrbitDB
   *
   * NOTE: The identity object created is an extension/modification of the built-in Identity type
   * used by OrbitDB and isn't stored permanently anywhere
   *
   * @param options Options/metdata used when "creating" a new OrbitDB identity
   * @returns An LFAIdentity object containing necessary metadata for verification/signing of OrbitDB records
   */
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

  /**
   * Generate an LFAIdentity object given a combination of LFA user ID, team ID and key generation
   *
   * NOTE: This record is generated ad hoc from the current information on the sigchain
   *
   * @param hash A serialized object containing the LFA user ID, team ID and key generation used for a given entry
   * @returns LFAIdentity object associated with a given user ID
   */
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

  /**
   * Verify that an identity record associated with an OrbitDB entry is valid and matches the info on
   * the sigchain
   *
   * @param identity LFAIdentity record to verify with the sigchain
   * @returns True if the user and its metadata matches the chain, otherwise this throws an error
   */
  public async verifyIdentity(identity: LFAIdentity): Promise<boolean> {
    return this.provider.verifyIdentity(identity)
  }

  /**
   * Sign an OrbitDB identity using sigchain signing keys for a given user
   *
   * @param identity LFAIdentity object to sign
   * @param data Data to sign with (included to match built-in type)
   * @returns Signature for a given identity
   */
  public async sign(identity: LFAIdentity, data: string | Uint8Array): Promise<string> {
    return this.provider.sign(identity.id, identity.teamId, data)
  }

  /**
   * Verify a signature
   *
   * NOTE: We already verify signatures on any OrbitDB records that are encrypted
   *
   * TODO: Decide if we want to store signatures to verify
   *
   * @param signature Signature to verify (this is a hex string representation of an LFA signed envelope)
   * @param publicKey Unused public key (the key used for verification is pulled from the sigchain)
   * @param data Data that was signed
   * @returns True if the signature is valid
   */
  public async verify(signature: string, publicKey: string, data: string): Promise<boolean> {
    return this.provider.verify(signature, '', data)
  }
}

export { LFAIdentities }
