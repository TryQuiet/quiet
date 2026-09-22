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
      this.sigchainService.user.userId,
      this.sigchainService.activeTeamId!
    )
    const teamId = sigchain.team!.id
    const device = sigchain.device
    const identityMetadata: LFAIdentityMetadata = {
      id: user.userId,
      deviceId: device.deviceId,
      teamId,
      publicKey: device.keys.signature.publicKey,
    }
    const identityBytes = this.serializer.serialize(identityMetadata, SerializerEncodingType.UINT8ARRAY)
    const identityHash = uint8arrays.toString(identityBytes, 'hex')
    return {
      ...identityMetadata,
      type: this.provider.type,
      provider: this.provider,
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
   * Generate an LFAIdentity object given serialized identity metadata (LFA user ID, device ID, team
   * ID and device signing key)
   *
   * NOTE: The metadata is entry-controlled. This only checks that the named user is a current member;
   * `verifyIdentity` is what binds the device and key to that user.
   *
   * @param hash Hex-encoded serialized LFAIdentityMetadata, as carried in `entry.identity`
   * @returns LFAIdentity object associated with the given metadata
   */
  public async getIdentity(hash: string): Promise<LFAIdentity> {
    const bytes = uint8arrays.fromString(hash, 'hex')
    const { id, deviceId, teamId, publicKey } = this.serializer.deserialize(bytes) as LFAIdentityMetadata
    if ([id, deviceId, teamId, publicKey].some(field => typeof field !== 'string')) {
      throw new Error('Malformed OrbitDB identity metadata')
    }
    this.provider.getUserAndChain(id, teamId)
    return {
      id,
      deviceId,
      teamId,
      publicKey,
      type: this.provider.type,
      provider: this.provider,
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
   * @param signature Signature to verify (this is a hex string representation of an LFA signed envelope)
   * @param publicKey Public key OrbitDB attributes the entry to (`entry.key`)
   * @param data Data that was signed
   * @returns True if the signature is valid
   */
  public async verify(signature: string, publicKey: string, data: string): Promise<boolean> {
    return this.provider.verify(signature, publicKey, data)
  }
}

export { LFAIdentities }
