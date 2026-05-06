// TODO: Expand to include converting strings specifically
// TODO: Use for serializing/deserializing keyrings

import { Injectable, Optional } from '@nestjs/common'
import { addExtension, Packr } from 'msgpackr'
import { type SerializerConfig, SerializerEncodingType, DEFAULT_PACKER_CONFIG } from '@quiet/types'
import { DateTime } from 'luxon'
import { createLogger } from './logger'

/**
 * Serialization helper class for converting between objects and buffers/uint8arrays without losing context
 * or information
 */
@Injectable()
export class Serializer {
  // msgpackr instance for standard objects
  private readonly _packer: Packr
  private readonly logger = createLogger('Utils:Serializer')

  constructor(@Optional() options?: SerializerConfig) {
    this._packer = new Packr(options?.packer ?? DEFAULT_PACKER_CONFIG)
    this._configureExtensions()
  }

  /**
   * Configure custom extensions for handling classes that aren't handled natively by msgpackr
   */
  private _configureExtensions(): void {
    // properly handle luxon DateTime objects
    addExtension({
      Class: DateTime,
      type: 1,
      write: (instance: DateTime): number => instance.toMillis(),
      read: (data: number): DateTime => DateTime.fromMillis(data).toUTC(),
    })
    // TODO: verify these being missing doesn't cause problems down the line before deleting
    // properly handle uint8arrays
    // addExtension({
    //   Class: Uint8Array,
    //   type: 3,
    //   write: (instance: Uint8Array | Buffer): string => {
    //     return isUint8Array(instance)
    //       ? uint8arrays.toString(instance, 'hex')
    //       : (instance as Buffer).toString('hex')
    //   },
    //   read: (data: unknown): unknown => {
    //     this.logger.warn(data)
    //     return typeof data === 'string' ? uint8arrays.fromString(data, 'hex') : data},
    // })
    // // properly handle buffers
    // addExtension({
    //   Class: Buffer,
    //   type: 1,
    //   write: (instance: Buffer): string => instance.toString('hex'),
    //   read: (data: string): Buffer => {
    //     this.logger.warn(data)
    //     return Buffer.from(data, 'hex') },
    // })
  }

  public serialize(payload: unknown, encoding?: SerializerEncodingType.BUFFER): Buffer
  public serialize(payload: unknown, encoding: SerializerEncodingType.UINT8ARRAY): Uint8Array
  /**
   * Serialize an arbitrary object
   *
   * @param payload Object to serialize into a buffer or uint8array
   * @param encoding Configure the serializer to output a buffer or uint8array (default = buffer)
   * @returns Buffer or UInt8Array representation of object
   */
  public serialize(
    payload: unknown,
    encoding: SerializerEncodingType = SerializerEncodingType.BUFFER
  ): Buffer | Uint8Array {
    try {
      const bufferPayload = this._packer.pack(payload)
      if (encoding == null || encoding === SerializerEncodingType.BUFFER) {
        return bufferPayload
      }

      return this.bufferToUint8array(bufferPayload)
    } catch (e) {
      this.logger.error('Error while serializing payload', e)
      throw new Error(`Error while serializing payload: ${e}`)
    }
  }

  /**
   * Deserialize a buffer or uint8array back to its original object form
   *
   * @param serializedPayload Buffer or UInt8Array representation of an object
   * @returns Reconstituted object
   */
  public deserialize<T = unknown>(serializedPayload: Buffer | Uint8Array): T {
    let buffer: Buffer | undefined = undefined
    if (serializedPayload instanceof Uint8Array) {
      buffer = this.uint8arrayToBuffer(serializedPayload as Uint8Array)
    } else {
      buffer = serializedPayload
    }

    return this._packer.unpack(buffer) as T
  }

  /**
   * Converts a buffer to its Uint8Array representation
   *
   * @param buffer Buffer to convert to UInt8Array
   * @returns Uint8Array representation of a buffer
   */
  public bufferToUint8array(buffer: Buffer): Uint8Array {
    try {
      return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength)
    } catch (e) {
      this.logger.error('Error while converting buffer to uint8array', e)
      throw new Error(`Error while converting buffer to uint8array: ${e}`)
    }
  }

  /**
   * Converts a uint8array to its buffer representation
   *
   * @param uint8array Uint8array to convert to Buffer
   * @returns Buffer representation of a uint8array
   */
  public uint8arrayToBuffer(uint8array: Uint8Array): Buffer {
    try {
      return Buffer.from(uint8array.buffer, uint8array.byteOffset, uint8array.byteLength)
    } catch (e) {
      this.logger.error('Error while converting uint8array to buffer', e)
      throw new Error(`Error while converting uint8array to buffer: ${e}`)
    }
  }
}
