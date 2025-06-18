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
  private deferredProfiles: UserProfile[] = []
  private nicknameMaps: Map<string, string> = new Map()

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

    // Try to post entries that were deferred when team state changes
    this.auth.on('update', async payload => {
      this.flushDeferredEntries()
    })

    this.store.events.on('update', async (entry: LogEntry) => {
      logger.info('Database update')
      this.emit(StorageEvents.USER_PROFILES_STORED, {
        profiles: await this.getUserProfiles(),
      })
    })
    this.flushDeferredEntries()
    this.emit(StorageEvents.USER_PROFILES_STORED, {
      profiles: await this.getUserProfiles(),
    })
  }

  public async startSync() {
    await this.getStore().sync.start()
    await this.flushDeferredEntries()
  }

  public async flushDeferredEntries() {
    if (this.deferredProfiles.length === 0) {
      logger.info('No deferred user profiles to flush')
      return
    }
    if (!this.auth.team) {
      logger.info('No team found, cannot flush deferred user profiles')
      return
    }
    if (!this.auth.team.memberHasRole(this.auth.user.userId, RoleName.MEMBER)) {
      logger.warn('User does not have permission to write to the user profiles store')
      return
    }
    logger.info('Flushing deferred user profiles:', this.deferredProfiles.length)

    for (const profile of this.deferredProfiles) {
      try {
        await this.setEntry(profile.userId, profile)
      } catch (err) {
        logger.error('Failed to flush deferred user profile:', profile.userId, err)
      }
    }
    this.deferredProfiles = []
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
    logger.debug('Decrypting user profile:', payload)
    try {
      // Normalize encrypted.contents to a Buffer/Uint8Array for decryption
      const encrypted = payload.encrypted
      // Handle Base64 string case
      if (typeof encrypted.contents === 'string') {
        logger.debug('Converting Base64 string to Buffer')
        encrypted.contents = Buffer.from(encrypted.contents, 'base64')
      }
      // Handle numeric array case (JSON-encoded Uint8Array)
      else if (Array.isArray(encrypted.contents)) {
        logger.debug('Converting numeric array to Buffer')
        encrypted.contents = Buffer.from(encrypted.contents)
      }
      // Handle Node.js Buffer JSON representation ({"type":"Buffer","data":[...]})
      else if (
        encrypted.contents &&
        typeof encrypted.contents === 'object' &&
        (encrypted.contents as any).type === 'Buffer' &&
        Array.isArray((encrypted.contents as any).data)
      ) {
        logger.debug('Converting JSON Buffer representation to Buffer')
        encrypted.contents = Buffer.from((encrypted.contents as any).data)
      }
      // Handle object with numeric keys (parsed JSON representation)
      else if (encrypted.contents && typeof encrypted.contents === 'object' && !Buffer.isBuffer(encrypted.contents)) {
        logger.debug('Converting object with numeric keys to Buffer')
        const nums = Object.keys(encrypted.contents)
          .filter(key => /^\d+$/.test(key))
          .map(key => (encrypted.contents as any)[key] as number)
        encrypted.contents = Buffer.from(nums)
      }
      logger.debug('Decrypting payload:', encrypted)
      const decryptedPayload = this.auth.crypto.decryptAndVerify<UserProfile>(encrypted, payload.signature)
      if (!decryptedPayload.isValid) {
        throw new Error('Failed to decrypt user entry: invalid signature')
      }
      return decryptedPayload.contents
    } catch (err) {
      logger.error('Failed to decrypt user entry:', err)
      logger.error('Failed to decrypt user entry:', payload)
      throw err
    }
  }

  public async getEntry(key: string): Promise<UserProfile> {
    const entry = await this.getStore().get(key)
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
      }
      const encEntry = await this.encryptEntry(userProfile)
      await this.getStore().put(key, encEntry)
      this.nicknameMaps.set(userProfile.userId, userProfile.nickname)
      return encEntry
    } catch (err) {
      logger.error('Failed to add user profile', userProfile.userId, err)
      this.deferredProfiles.push(userProfile)
      throw err
    }
  }

  public static async validateUserProfile(userProfile: UserProfile) {
    try {
      if (userProfile?.photo && !validatePhoto(userProfile.photo, userProfile.userId)) {
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
    const results = await Promise.all(
      encValues.map(async value => {
        try {
          return await this.decryptEntry(value)
        } catch (error) {
          logger.error('Failed to decrypt entry:', error)
          return null
        }
      })
    )
    const userProfiles = results.filter((profile): profile is UserProfile => profile !== null)
    this.nicknameMaps = new Map(userProfiles.map(profile => [profile.userId, profile.nickname]))
    return userProfiles
  }

  public async getUsername(userId: string): Promise<string | undefined> {
    return this.nicknameMaps.get(userId)
  }

  clean(): void {
    logger.info('Cleaning user profiles store')
    this.store = undefined
  }
}
