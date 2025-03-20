/**
 * Key exchange encryption logic for websocket connections
 */

import { Injectable } from '@nestjs/common'
import type { CryptoKX, KeyPair } from 'libsodium-wrappers-sumo'
import { isUint8Array } from 'node:util/types'
import * as uint8arrays from 'uint8arrays'
import { createLogger } from '../../common/logger'
import { SodiumHelper } from './sodium.helper'
import { DecryptionError, EncryptionBase64Error, EncryptionError, KeyGenError } from './qss-enc.types'

@Injectable()
export class QSSKXEncryptionService {
  private readonly logger = createLogger(`qss:encryption`)

  constructor(public readonly sodiumHelper: SodiumHelper) {}

  /**
   * Create a key pair for generating the shared session keys between client and server
   *
   * @returns A public-private key pair formed with a random seed
   */
  public generateKeyPair(): KeyPair {
    const randomSeed = this.sodiumHelper.sodium.crypto_generichash(32, this.sodiumHelper.sodium.randombytes_buf(512))
    return this.sodiumHelper.sodium.crypto_kx_seed_keypair(randomSeed, 'uint8array')
  }

  /**
   * Generate a shared key pair using our own public-private key pair and the other party's public
   * key.
   *
   * NOTE: The output of this is an object with the fields `sharedRx` and `sharedTx`.  The relationship
   * between client and server keys is as follows:
   *
   *    client.sharedRx === server.sharedTx
   *    client.sharedTx === server.sharedRx
   *
   * @param keyPair Public-private key pair owned by client or server
   * @param otherPublicKey Public key from the other party's key pair as either base64 or Uint8Array
   * @returns Shared key pair between client and server
   * @throws {EncryptionBase64Error} If the string is not valid base64
   * @throws {KeyGenError} Keys are invalid
   */
  public generateSharedSessionKeyPair(keyPair: KeyPair, otherPublicKey: Uint8Array | string): CryptoKX {
    try {
      if (typeof otherPublicKey === 'string') {
        otherPublicKey = this.sodiumHelper.fromBase64(otherPublicKey)
      }

      return this.sodiumHelper.sodium.crypto_kx_client_session_keys(
        keyPair.publicKey,
        keyPair.privateKey,
        otherPublicKey
      )
    } catch (e) {
      if (e instanceof EncryptionBase64Error) {
        throw e
      }
      throw new KeyGenError(`Failed to generate shared session key pair`, e as Error)
    }
  }

  /**
   * Encrypt an arbitrary payload using the shared session key pair
   *
   * @param payload Payload to encrypt, can be any type
   * @param sessionKey Shared key pair
   * @returns Base64 encoded encrypted payload
   * @throws {EncryptionBase64Error} If the string cannot be converted to Uint8Array
   * @throws {EncryptionError} An error occurs while creating the nonce or creating the secret box
   */
  public encrypt(payload: unknown, sessionKey: CryptoKX): string {
    try {
      let usablePayload: string | Uint8Array | undefined = undefined
      if (typeof payload === 'string') {
        usablePayload = payload
      } else if (isUint8Array(payload)) {
        usablePayload = payload
      } else {
        usablePayload = JSON.stringify(payload)
      }

      const nonce = this.sodiumHelper.sodium.randombytes_buf(this.sodiumHelper.sodium.crypto_secretbox_NONCEBYTES)
      const encrypted = this.sodiumHelper.sodium.crypto_secretbox_easy(
        usablePayload,
        nonce,
        sessionKey.sharedTx,
        'uint8array'
      )
      return this.sodiumHelper.toBase64(uint8arrays.concat([nonce, encrypted]))
    } catch (e) {
      if (e instanceof EncryptionBase64Error) {
        throw e
      }
      throw new EncryptionError(`Failed to encrypt payload with session key`, e as Error)
    }
  }

  /**
   * Decrypt a base64 encrypted payload using the shared session key pair
   *
   * @param encryptedPayload Base64 encoded encrypted payload
   * @param sessionKey Shared key pair
   * @returns Original payload that was encrypted
   * @throws {EncryptionBase64Error} If the string is not valid base64
   * @throws {DecryptionError} If the payload is not a valid encrypted payload using this session key
   */
  public decrypt(encryptedPayload: string, sessionKey: CryptoKX): unknown {
    try {
      const encryptedPayloadBytes = this.sodiumHelper.fromBase64(encryptedPayload)
      if (
        encryptedPayloadBytes.length <
        this.sodiumHelper.sodium.crypto_secretbox_NONCEBYTES + this.sodiumHelper.sodium.crypto_secretbox_MACBYTES
      ) {
        throw new DecryptionError(`Encrypted payload was too short to be valid`)
      }

      const nonce = encryptedPayloadBytes.slice(0, this.sodiumHelper.sodium.crypto_secretbox_NONCEBYTES)
      const cipherText = encryptedPayloadBytes.slice(this.sodiumHelper.sodium.crypto_secretbox_NONCEBYTES)
      const stringPayload = uint8arrays.toString(
        this.sodiumHelper.sodium.crypto_secretbox_open_easy(cipherText, nonce, sessionKey.sharedRx, 'uint8array')
      )
      return JSON.parse(stringPayload) as unknown
    } catch (e) {
      if (e instanceof EncryptionBase64Error) {
        throw e
      }

      throw new DecryptionError(`Failed to decrypt payload with session key`, e as Error)
    }
  }
}
