import { Injectable } from '@nestjs/common'
import { EventEmitter } from 'events'
import KeyValueStore from 'orbit-db-kvstore'
import { IdentityProvider } from 'orbit-db-identity-provider'
import { getCrypto, ICryptoEngine } from 'pkijs'
import { sha256 } from 'multiformats/hashes/sha2'
import * as Block from 'multiformats/block'
import * as dagCbor from '@ipld/dag-cbor'
import { stringToArrayBuffer } from 'pvutils'

import { Logger } from '@quiet/logger'
import { NoCryptoEngineError, UserProfile } from '@quiet/types'
import { keyObjectFromString, verifySignature } from '@quiet/identity'
import { constructPartial } from '@quiet/common'

import createLogger from '../../common/logger'
import { OrbitDb } from '../orbitDb/orbitDb.service'
import { StorageEvents } from '../storage.types'
import { KeyValueIndex } from '../orbitDb/keyValueIndex'
import { validatePhoto } from './userProfile.utils'

const logger = createLogger('UserProfileStore')

@Injectable()
export class UserProfileStore extends EventEmitter {
  public store: KeyValueStore<UserProfile>

  // Copying OrbitDB by using dag-cbor/sha256 for converting the
  // profile to a byte array for signing:
  // https://github.com/orbitdb/orbitdb/blob/3eee148510110a7b698036488c70c5c78f868cd9/src/oplog/entry.js#L75-L76
  // I think any encoding would work here.
  public static readonly codec = dagCbor
  public static readonly hasher = sha256

  constructor(private readonly orbitDbService: OrbitDb) {
    super()
  }

  public async init() {
    logger('Initializing user profiles key/value store')

    this.store = await this.orbitDbService.orbitDb.keyvalue<UserProfile>('user-profiles', {
      replicate: false,
      // Partially construct index so that we can include an
      // IdentityProvider in the index validation logic. OrbitDB
      // expects the store index to be constructable with zero
      // arguments.
      //
      // @ts-expect-error
      Index: constructPartial(UserProfileKeyValueIndex, [
        // @ts-expect-error - OrbitDB's type declaration of OrbitDB lacks identity
        this.orbitDbService.orbitDb.identity.provider,
      ]),
      accessController: {
        write: ['*'],
      },
    })

    this.store.events.on('write', (_address, entry) => {
      logger('Saved user profile locally')
      this.emit(StorageEvents.USER_PROFILES_STORED, {
        profiles: [entry.payload.value],
      })
    })

    this.store.events.on('ready', async () => {
      logger('Loaded user profiles to memory')
      this.emit(StorageEvents.USER_PROFILES_STORED, {
        profiles: this.getUserProfiles(),
      })
    })

    this.store.events.on('replicated', async () => {
      logger('Replicated user profiles')
      this.emit(StorageEvents.USER_PROFILES_STORED, {
        profiles: this.getUserProfiles(),
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

      if (!validatePhoto(profile.photo, userProfile.pubKey)) {
        return false
      }
    } catch (err) {
      logger.error('Failed to validate user profile:', userProfile.pubKey, err?.message)
      return false
    }

    return true
  }

  public static async validateUserProfileEntry(
    identityProvider: typeof IdentityProvider,
    entry: LogEntry<UserProfile>
  ) {
    try {
      if (entry.payload.key !== entry.payload.value.pubKey) {
        logger.error('Failed to verify user profile entry:', entry.hash, 'entry key != payload pubKey')
        return false
      }

      return await UserProfileStore.validateUserProfile(entry.payload.value)
    } catch (err) {
      logger.error('Failed to validate user profile entry:', entry.hash, err?.message)
      return false
    }
  }

  public getUserProfiles(): UserProfile[] {
    return Object.values(this.store.all)
  }
}

export class UserProfileKeyValueIndex extends KeyValueIndex<UserProfile> {
  constructor(identityProvider: typeof IdentityProvider) {
    super(identityProvider, UserProfileStore.validateUserProfileEntry)
  }
}
