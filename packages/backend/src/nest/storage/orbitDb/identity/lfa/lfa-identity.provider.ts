/**
 * OrbitDB identity provider that uses LFA for verification/signing rather than the standard
 * OrbitDB model of identity.
 *
 * Entries are signed with the LFA *device* key and the identity names the device. Device keys never
 * rotate and a device belongs to exactly one user for the life of the team, so an entry can be
 * checked against the device's registration without any key history. (User keys rotate, which is
 * why LFA itself authors graph links as devices too.)
 *
 * NOTE: This doesn't store ANY identity data in OrbitDB, all identification is handled
 * ad hoc using the sigchain.
 */

import { IdentityProvider } from '@orbitdb/core'
import { LFA_IDENTITY_PROVIDER_TYPE, LFA_ORBITDB_ENTRY_SIGNATURE_CONTEXT } from './const'
import { Injectable } from '@nestjs/common'
import { SigChainService } from '../../../../auth/sigchain.service'
import { SigChain } from '../../../../auth/sigchain'
import {
  LFAIdentity,
  LFAIdentityProviderGetIdError,
  LFAIdentityProviderSignError,
  LFAIdentityProviderVerifyError,
  LFAUserAndChain,
  SignatureWithTeamId,
} from './types'
import { Base58, Member, signatures } from '@localfirst/auth'
import { hash } from '@localfirst/crypto'
import { createLogger } from '../../../../common/logger'
import { randomUUID } from 'crypto'
import { Serializer } from '../../../../common/serializer.service'
import { SerializerEncodingType } from '@quiet/types'
import * as uint8arrays from 'uint8arrays'

@Injectable()
class LFAIdentityProvider implements IdentityProvider {
  private readonly logger = createLogger('orbitdb:identity:lfa:provider')

  constructor(
    private readonly serializer: Serializer,
    private readonly sigchainService: SigChainService
  ) {}

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
   * Generate a static signature using your user's keys from the sigchain to be added to the identity
   * record
   *
   * NOTE: We don't use these signatures for real so we just return an arbitrary string
   *
   * TODO: Actually do something with this signature or delete the signature logic
   *
   * @param userId LFA user ID
   * @param teamId LFA team ID
   * @returns Signature generated using this user's keys
   */
  public async signIdentity(userId: string, teamId: string): Promise<string> {
    try {
      // TODO: replace this with `sign` if we end up signing the identity records themselves
      const { user, sigchain } = this.getUserAndChain(userId, teamId)
      const userFromContext = sigchain.context.user
      if (userFromContext.userId !== user.userId || userFromContext.keys.signature.publicKey != user.keys.signature) {
        throw new Error('User ID and/or public signing key does not match context user')
      }
      // return a random string because this static identity signature is unused
      return randomUUID()
    } catch (e) {
      throw new LFAIdentityProviderSignError(e)
    }
  }

  /**
   * Validate a given identity from OrbitDB against the sigchain: the user must be a current member
   * and the identity's device and key must be that user's registered device and its signing key.
   *
   * @param identity LFAIdentity object to be verified
   * @returns True if the identity matches what is on the sigchain
   */
  public async verifyIdentity(identity: LFAIdentity): Promise<boolean> {
    try {
      const { sigchain } = this.getUserAndChain(identity.id, identity.teamId)
      const device = this.getDevice(sigchain, identity.deviceId)
      return (
        identity.type === this.type && device.userId === identity.id && device.keys.signature === identity.publicKey
      )
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
    const sigchain = this.sigchainService.getChain(teamId, true)
    const user = sigchain.users.getUserById(userId, { includeRemoved, throwOnMissing: true })
    return {
      user,
      sigchain,
    }
  }

  /**
   * Look up a device's registration on the team, including devices that have since been removed.
   *
   * Removed devices are tombstoned with their keys, and an OrbitDB entry carries no chain position,
   * so there is no way to tell an entry signed before the removal from one signed after it. Policy
   * to begin with: keep history authored from an unlinked device verifiable, and accept that an
   * unlinked device can keep signing as its user until the user is removed. Binding entries to a
   * chain head is the eventual fix for that.
   *
   * @param sigchain Chain to look the device up on
   * @param deviceId LFA device ID
   * @returns The device record (throws if the device was never on the team)
   */
  private getDevice(sigchain: SigChain, deviceId: string) {
    return sigchain.team!.device(deviceId, { includeRemoved: true })
  }

  /**
   * Sign an arbitrary packet of data with this device's LFA signature key
   *
   * @param userId LFA user ID
   * @param teamId LFA team ID
   * @param payload Data to be signed
   * @returns Hex representation of the signed envelope
   */
  public sign(userId: string, teamId: string, payload: any): string {
    try {
      // validate your user is on the chain
      const { user, sigchain } = this.getUserAndChain(userId, teamId)
      // ensure the user on the chain matches the user in our context
      if (sigchain.context.user.userId !== user.userId) {
        throw new Error('User ID does not match context user')
      }
      const device = sigchain.device
      const signature = signatures.sign(payload, device.keys.signature.secretKey, LFA_ORBITDB_ENTRY_SIGNATURE_CONTEXT)
      return this._signedEnvelopeToHex({
        signature,
        author: { type: device.keys.type, name: device.keys.name, generation: device.keys.generation },
        teamId,
      })
    } catch (e) {
      throw new LFAIdentityProviderSignError(e)
    }
  }

  /**
   * Verify an LFA signature on an OrbitDB log entry
   *
   * @param signature Hex representation of the signed envelope
   * @param publicKey Public key OrbitDB attributes the entry to (`entry.key`)
   * @param data Data packet that was signed
   * @returns True if the signature is valid
   */
  public verify(signature: string, publicKey: string, data: string): boolean {
    try {
      const envelope = this._hexToSignedEnvelope(signature)
      const sigchain = this.sigchainService.getChain(envelope.teamId, true)
      // Only device keys sign entries; a user keyset named in the envelope never resolves to a device
      const device = this.getDevice(sigchain, envelope.author.name)
      if (envelope.author.type !== device.keys.type) {
        return false
      }
      // The key OrbitDB attributes the entry to must be the registered key of the device the envelope
      // names; otherwise the envelope could name one device while the entry is attributed to another.
      if (device.keys.signature !== publicKey) {
        return false
      }
      return signatures.verify({
        payload: data,
        signature: envelope.signature,
        publicKey: publicKey as Base58,
        context: LFA_ORBITDB_ENTRY_SIGNATURE_CONTEXT,
      })
    } catch (e) {
      this.logger.error('Error validating OrbitDB entry signature', e)
      return false
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

  /**
   * Serialize an LFA signed envelope and convert to a hex string
   *
   * @param signedEnvelope LFA signed envelope
   * @returns Hex representation of the signed envelope
   */
  private _signedEnvelopeToHex(signedEnvelope: SignatureWithTeamId): string {
    return uint8arrays.toString(this.serializer.serialize(signedEnvelope, SerializerEncodingType.UINT8ARRAY), 'hex')
  }

  /**
   * Serialize the hex and deserialize to the original signed envelope
   *
   * @param hexSignedEnvelope Hex representation of LFA signed envelope
   * @returns Deserialized signed envelope
   */
  private _hexToSignedEnvelope(hexSignedEnvelope: string): SignatureWithTeamId {
    return this.serializer.deserialize<SignatureWithTeamId>(uint8arrays.fromString(hexSignedEnvelope, 'hex'))
  }
}

export { LFAIdentityProvider }
