import { Injectable } from '@nestjs/common'
import _sodium from 'libsodium-wrappers-sumo'
import { createLogger } from '../../common/logger'
import { Base64ErrorDirection, EncryptionBase64Error } from './qss-enc.types'

@Injectable()
export class SodiumHelper {
  public localSodium: typeof _sodium | undefined = undefined

  private readonly logger = createLogger(`qss:enc:sodium-helper`)

  /**
   * Ensure sodium is initialized before using
   */
  public async onModuleInit(): Promise<void> {
    await _sodium.ready
    this.localSodium = _sodium
  }

  public get sodium(): typeof _sodium {
    if (this.localSodium == null) {
      throw new Error(`Libsodium not initialized!`)
    }

    return this.localSodium
  }

  /**
   * Get a byte array for a base64 string
   *
   * @param base64Payload Base64 encoded string
   * @returns Byte array representation of the payload
   * @throws {EncryptionBase64Error} If the string is not valid base64
   */
  public fromBase64(base64Payload: string): Uint8Array {
    try {
      return this.sodium.from_base64(base64Payload)
    } catch (e) {
      throw new EncryptionBase64Error(Base64ErrorDirection.From, e as Error)
    }
  }

  /**
   * Get a base64 string for a byte array
   *
   * @param Uint8Array bytes Byte array
   * @returns string Base64 encoded string representation of the payload
   * @throws {EncryptionBase64Error} If the string cannot be converted to Uint8Array
   */
  public toBase64(bytes: Uint8Array): string {
    try {
      return this.sodium.to_base64(bytes)
    } catch (e) {
      throw new EncryptionBase64Error(Base64ErrorDirection.To, e as Error)
    }
  }
}
