import { Injectable } from '@nestjs/common'
import { type LogEntry, type KeyValueType, IPFSAccessController } from '@orbitdb/core'
import { UserProfile } from '@quiet/types'

import { createLogger } from '../../common/logger'
import { OrbitDbService } from '../orbitDb/orbitDb.service'
import { StorageEvents } from '../storage.types'
import { KeyValueIndexedValidated } from '../orbitDb/keyValueIndexedValidated'
import { validatePhoto } from './userProfile.utils'
import { EncryptedKeyValueStoreBase } from '../base.store'
import { EncryptedAndSignedPayload, EncryptionScopeType } from '../../auth/services/crypto/types'
import { SigChainService } from '../../auth/sigchain.service'
import { RoleName } from '../../auth/services/roles/roles'

const logger = createLogger('UserProfileStore')

@Injectable()
export class UserProfileStore extends EncryptedKeyValueStoreBase<EncryptedAndSignedPayload, UserProfile> {
  constructor(
    private readonly orbitDbService: OrbitDbService,
    private readonly auth: SigChainService
  ) {
    super()
  }

  public async init() {
    logger.info('Initializing user profiles key/value store')

    this.store = await this.orbitDbService.orbitDb.open<KeyValueType<EncryptedAndSignedPayload>>('user-profiles', {
      type: 'KeyValueIndexedValidated',
      sync: false,
      Database: KeyValueIndexedValidated(this.validateEntry.bind(this)),
      AccessController: IPFSAccessController({ write: ['*'] }),
    })

    this.store.events.on('update', async (entry: LogEntry) => {
      logger.info('Database update')
      this.emit(StorageEvents.USER_PROFILES_STORED, {
        profiles: await this.getUserProfiles(),
      })
    })

    this.emit(StorageEvents.USER_PROFILES_STORED, {
      profiles: await this.getUserProfiles(),
    })
  }

  public async startSync() {
    await this.getStore().sync.start()
  }

  public async encryptEntry(payload: UserProfile): Promise<EncryptedAndSignedPayload> {
    try {
      const encryptedPayload = this.auth.crypto.encryptAndSign(payload, {
        type: EncryptionScopeType.ROLE,
        name: RoleName.MEMBER,
      })
      return encryptedPayload
    } catch (err) {
      logger.error('Failed to encrypt user entry:', err)
      throw err
    }
  }

  public async decryptEntry(payload: EncryptedAndSignedPayload): Promise<UserProfile> {
    try {
      const decryptedPayload = this.auth.crypto.decryptAndVerify<UserProfile>(payload.encrypted, payload.signature)
      if (!decryptedPayload.isValid) {
        throw new Error('Failed to decrypt user entry: invalid signature')
      }
      return decryptedPayload.contents
    } catch (err) {
      logger.error('Failed to decrypt user entry:', err)
      throw err
    }
  }

  public async getEntry(key: string): Promise<UserProfile> {
    const entry = await this.store?.get(key)
    if (!entry) {
      throw new Error(`Entry with key ${key} not found`)
    }
    return this.decryptEntry(entry)
  }

  public async setEntry(key: string, userProfile: UserProfile): Promise<EncryptedAndSignedPayload> {
    logger.info('Adding user profile')
    try {
      if (!UserProfileStore.validateUserProfile(userProfile)) {
        // TODO: Send validation errors to frontend or replicate
        // validation on frontend?
        logger.error('Failed to add user profile, profile is invalid', userProfile.userId)
        throw new Error('Failed to add user profile')
      }
      const encEntry = await this.encryptEntry(userProfile)
      await this.getStore().put(key, encEntry)
      return encEntry
    } catch (err) {
      logger.error('Failed to add user profile', userProfile.userId, err)
      throw new Error('Failed to add user profile')
    }
  }

  public static async validateUserProfile(userProfile: UserProfile) {
    try {
      if (userProfile.profile?.photo && !validatePhoto(userProfile.profile.photo, userProfile.userId)) {
        return false
      }
    } catch (err) {
      logger.error('Failed to validate user profile:', userProfile.userId, err)
      return false
    }
    return true
  }

  public async validateEntry(entry: LogEntry<EncryptedAndSignedPayload>): Promise<boolean> {
    try {
      if (!entry.payload.value) {
        logger.error(`Failed to verify user profile entry: ${entry.hash} entry payload is empty`)
        return false
      }
      const decEntry = await this.decryptEntry(entry.payload.value)
      if (entry.payload.key !== decEntry.userId) {
        logger.error(`Failed to verify user profile entry: ${entry.hash} entry key != payload pubKey`)
        return false
      }
      return await UserProfileStore.validateUserProfile(decEntry)
    } catch (err) {
      logger.error('Failed to validate user profile entry:', entry.hash, err)
      return false
    }
  }

  public async getUserProfiles(): Promise<UserProfile[]> {
    const encValues = (await this.getStore().all()).map(x => x.value)
    return Promise.all(encValues.map(this.decryptEntry.bind(this)))
  }

  clean(): void {
    logger.info('Cleaning user profiles store')
    this.store = undefined
  }
}
