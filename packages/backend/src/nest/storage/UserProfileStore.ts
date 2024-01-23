import { Injectable } from '@nestjs/common'
import { EventEmitter } from 'events'
import KeyValueStore from 'orbit-db-kvstore'
import OrbitDB from 'orbit-db'
import { getCrypto, ICryptoEngine } from 'pkijs'
import { sha256 } from 'multiformats/hashes/sha2'
import { stringToArrayBuffer } from 'pvutils'
import * as Block from 'multiformats/block'
import * as dagCbor from '@ipld/dag-cbor'

import { Logger } from '@quiet/logger'
import { NoCryptoEngineError, UserProfile } from '@quiet/types'
import { keyObjectFromString, verifySignature } from '@quiet/identity'

import { StorageEvents } from './storage.types'
import createLogger from '../common/logger'

const logger = createLogger('UserProfileStore')

/**
 * Check magic byte sequence to determine if buffer is a PNG image.
 */
export const isPng = (buffer: Uint8Array): boolean => {
  // https://en.wikipedia.org/wiki/PNG
  const pngHeader = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]

  if (buffer.length < pngHeader.length) {
    return false
  }

  for (let i = 0; i < pngHeader.length; i++) {
    if (buffer[i] !== pngHeader[i]) {
      return false
    }
  }
  return true
}

/**
 * Takes a base64 data URI string that starts with 'data:*\/*;base64,'
 * as returned from
 * https://developer.mozilla.org/en-US/docs/Web/API/FileReader/readAsDataURL
 * and converts it to a Uint8Array.
 */
export const base64DataURLToByteArray = (contents: string): Uint8Array => {
  const [header, base64Data] = contents.split(',')
  if (!header.startsWith('data:') || !header.endsWith(';base64')) {
    throw new Error('Expected base64 data URI')
  }
  const chars = atob(base64Data)
  const bytes = new Array(chars.length)
  for (let i = 0; i < chars.length; i++) {
    bytes[i] = chars.charCodeAt(i)
  }
  return new Uint8Array(bytes)
}

@Injectable()
export class UserProfileStore {
  public orbitDb: OrbitDB
  public store: KeyValueStore<UserProfile>

  // Copying OrbitDB by using dag-cbor/sha256 for converting the
  // profile to a byte array for signing:
  // https://github.com/orbitdb/orbitdb/blob/3eee148510110a7b698036488c70c5c78f868cd9/src/oplog/entry.js#L75-L76
  // I think any encoding would work here.
  public static readonly codec = dagCbor
  public static readonly hasher = sha256

  public async init(orbitDb: OrbitDB, emitter: EventEmitter) {
    logger('Initializing user profiles key/value store')

    this.orbitDb = orbitDb

    this.store = await this.orbitDb.keyvalue<UserProfile>('user-profiles', {
      replicate: false,
      Index: UserProfileKeyValueIndex,
      accessController: {
        write: ['*'],
      },
    })

    this.store.events.on('write', (_address, entry) => {
      logger('Saved user profile locally')
      emitter.emit(StorageEvents.LOADED_USER_PROFILES, {
        profiles: [entry.payload.value],
      })
    })

    this.store.events.on('ready', async () => {
      logger('Loaded user profiles to memory')
      emitter.emit(StorageEvents.LOADED_USER_PROFILES, {
        profiles: await this.getUserProfiles(),
      })
    })

    this.store.events.on('replicated', async () => {
      logger('Replicated user profiles')
      emitter.emit(StorageEvents.LOADED_USER_PROFILES, {
        profiles: await this.getUserProfiles(),
      })
    })

    // @ts-expect-error - OrbitDB's type declaration of `load` lacks 'options'
    await this.store.load({ fetchEntryTimeout: 15000 })
  }

  public getAddress() {
    return this.store?.address
  }

  public async close() {
    await this.store?.close()
  }

  public async addUserProfile(userProfile: UserProfile) {
    logger('Adding user profile')
    try {
      if (!UserProfileStore.validateUserProfile(userProfile)) {
        // TODO: Send validation errors to frontend or replicate
        // validation on frontend?
        logger.error('Failed to add user profile')
        return
      }
      await this.store.put(userProfile.pubKey, userProfile)
    } catch (err) {
      logger.error('Failed to add user profile', err)
    }
  }

  public static async validateUserProfile(userProfile: UserProfile) {
    // FIXME: Add additional validation to verify userProfile contains
    // required fields
    try {
      const crypto = getCrypto()
      if (!crypto) {
        throw new NoCryptoEngineError()
      }

      const profile = userProfile.profile
      const pubKey = await keyObjectFromString(userProfile.pubKey, crypto)
      const profileSig = stringToArrayBuffer(userProfile.profileSig)
      const { bytes } = await Block.encode({
        value: profile,
        codec: UserProfileStore.codec,
        hasher: UserProfileStore.hasher,
      })
      const verify = await verifySignature(profileSig, bytes, pubKey)

      if (!verify) {
        logger.error('User profile contains invalid signature', userProfile.pubKey)
        return false
      }

      if (typeof profile.photo !== 'string') {
        logger.error('Expected PNG for user profile photo', userProfile.pubKey)
        return false
      }

      if (!profile.photo.startsWith('data:image/png;base64,')) {
        logger.error('Expected PNG for user profile photo', userProfile.pubKey)
        return false
      }

      // We only accept PNG for now. I think some care needs to be used
      // with the Image element since it can make web requests and
      // accepts a variety of formats that we may want to limit. Some
      // interesting thoughts:
      // https://security.stackexchange.com/a/135636
      const photoBytes = base64DataURLToByteArray(profile.photo)
      if (!isPng(photoBytes)) {
        logger.error('Expected PNG for user profile photo', userProfile.pubKey)
        return false
      }

      // 200 KB = 204800 B limit
      //
      // TODO: Perhaps the compression matters and we should check
      // actual dimensions in pixels?
      if (photoBytes.length > 204800) {
        logger.error('User profile photo must be less than or equal to 200KB')
        return false
      }
    } catch (err) {
      logger.error('Failed to validate user profile:', userProfile.pubKey, err?.message)
      return false
    }

    return true
  }

  public static async validateUserProfileEntry(entry: LogEntry<UserProfile>) {
    let verify = false

    try {
      if (entry.payload.key !== entry.payload.value.pubKey) {
        logger.error('Failed to verify user profile entry:', entry.hash, 'entry key != payload pubKey')
        return false
      }
      verify = await UserProfileStore.validateUserProfile(entry.payload.value)
    } catch (err) {
      logger.error('Failed to verify user profile entry:', entry.hash, err?.message)
    }

    return verify
  }

  public async getUserProfiles(): Promise<UserProfile[]> {
    return Object.values(this.store.all)
  }
}

/**
 * Modified from:
 * https://github.com/orbitdb/orbit-db-kvstore/blob/main/src/KeyValueIndex.js
 *
 * Adds validation function that validates each entry before adding it
 * to the index.
 *
 * TODO: Save latest entry and only iterate over new entries in updateIndex
 */
export class KeyValueIndex<T> {
  private _index: Record<string, any>
  private validateFn: (entry: LogEntry<T>) => Promise<boolean>

  constructor(validateFn: (entry: LogEntry<T>) => Promise<boolean>) {
    this._index = {}
    this.validateFn = validateFn
  }

  get(key: string) {
    return this._index[key]
  }

  async updateIndex(oplog: { values: LogEntry<T>[] }) {
    const values: LogEntry<T>[] = []
    const handled: Record<string, boolean> = {}

    for (const v of oplog.values) {
      if (await this.validateFn(v)) {
        values.push(v)
      }
    }

    for (let i = values.length - 1; i >= 0; i--) {
      const item = values[i]
      if (typeof item.payload.key === 'string') {
        if (handled[item.payload.key]) {
          continue
        }
        handled[item.payload.key] = true
        if (item.payload.op === 'PUT') {
          this._index[item.payload.key] = item.payload.value
          continue
        }
        if (item.payload.op === 'DEL') {
          delete this._index[item.payload.key]
          continue
        }
      } else {
        logger.error(`Failed to update key/value index - key is not string: ${item.payload.key}`)
      }
    }
  }
}

export class UserProfileKeyValueIndex extends KeyValueIndex<UserProfile> {
  constructor() {
    super(UserProfileStore.validateUserProfileEntry)
  }
}
