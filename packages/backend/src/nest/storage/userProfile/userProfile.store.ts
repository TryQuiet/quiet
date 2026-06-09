import { Injectable } from '@nestjs/common'
import { type LogEntry, type KeyValueType, IPFSAccessController } from '@orbitdb/core'
import { SetUserProfileResponse, UserProfile } from '@quiet/types'

import { createLogger } from '../../common/logger'
import { OrbitDbService } from '../orbitDb/orbitDb.service'
import { StorageEvents } from '../storage.types'
import { KeyValueIndexedValidated, type KeyValueIndexedValidatedType } from '../orbitDb/keyValueIndexedValidated'
import { validatePhoto } from './userProfile.utils'
import { EncryptedKeyValueIndexedValidatedStoreBase } from '../base.store'
import { EncryptedAndSignedPayload, EncryptionScopeType } from '../../auth/services/crypto/types'
import { SigChainService } from '../../auth/sigchain.service'
import { RoleName } from '../../auth/services/roles/roles'
import { SigchainEvents } from '../../auth/types'

const logger = createLogger('UserProfileStore')

@Injectable()
export class UserProfileStore extends EncryptedKeyValueIndexedValidatedStoreBase<
  EncryptedAndSignedPayload,
  UserProfile
> {
  private deferredProfiles: UserProfile[] = []
  private nicknameMaps: Map<string, string> = new Map()

  constructor(
    private readonly orbitDbService: OrbitDbService,
    private readonly auth: SigChainService
  ) {
    super()
    this.auth.on(SigchainEvents.UPDATED, this.handleAuthUpdated)
  }

  public async init() {
    logger.info('Initializing user profiles key/value store')
    this.store = await this.orbitDbService.open<KeyValueIndexedValidatedType<EncryptedAndSignedPayload>>(
      'user-profiles',
      {
        type: 'KeyValueIndexedValidated',
        sync: false,
        Database: KeyValueIndexedValidated(this.validateEntry.bind(this)),
        AccessController: IPFSAccessController({ write: ['*'] }),
      }
    )

    this.store.events.on('update', (entry: LogEntry) => {
      this.getUserProfiles().then((profiles: UserProfile[]) => {
        this.emit(StorageEvents.USER_PROFILES_STORED, {
          profiles,
        })
      })
    })

    await this.store!.retryIndexingUnindexedEntries()

    this.emit(StorageEvents.USER_PROFILES_STORED, {
      profiles: await this.getUserProfiles(),
    })
  }

  private readonly handleAuthUpdated = async (): Promise<void> => {
    if (!this.store) {
      return
    }

    try {
      await this.flushDeferredEntries()
      await this.store.retryIndexingUnindexedEntries()
    } catch (err) {
      logger.error('Failed to update user profiles:', err)
    }
  }

  /**
   * Starts synchronization of the user profiles store and flushes deferred entries.
   */
  public async startSync() {
    await this.getStore().sync.start()
    await this.flushDeferredEntries()
  }

  /**
   * Attempts to write any deferred user profiles to the store if permissions allow.
   */
  public async flushDeferredEntries() {
    if (this.deferredProfiles.length === 0) {
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

    const profilesToFlush = [...this.deferredProfiles]
    this.deferredProfiles = []

    for (const profile of profilesToFlush) {
      try {
        await this.setEntry(profile.userId, profile)
      } catch (err) {
        logger.error('Failed to flush deferred user profile:', profile.userId, err)
      }
    }
  }

  public deferEntry(userProfile: UserProfile): void {
    logger.info('Deferring user profile until storage permissions are ready:', userProfile.userId)
    this.deferredProfiles.push(userProfile)
  }

  /**
   * Encrypts and signs a user profile for secure storage.
   * @param payload The user profile to encrypt.
   * @returns The encrypted and signed payload.
   * @throws If encryption or signing fails.
   */
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

  /**
   * Decrypts and verifies an encrypted user profile payload.
   * @param payload The encrypted and signed payload.
   * @returns The decrypted user profile.
   * @throws If decryption or signature verification fails.
   */
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

  /**
   * Retrieves and decrypts a user profile by key.
   * @param key The user ID or key for the profile.
   * @returns The user profile.
   * @throws If the entry is not found or decryption fails.
   */
  public async getEntry(key: string): Promise<UserProfile> {
    const entry = await this.getStore().get(key)
    if (!entry) {
      throw new Error(`Entry with key ${key} not found`)
    }
    return this.decryptEntry(entry)
  }

  /**
   * Encrypts and stores a user profile entry in the store.
   * @param key The user ID or key for the profile.
   * @param userProfile The user profile to store.
   * @returns The encrypted and signed payload.
   * @throws If encryption or storage fails.
   */
  public async setEntry(key: string, userProfile: UserProfile): Promise<EncryptedAndSignedPayload> {
    logger.info('Adding user profile')
    try {
      if (!UserProfileStore.validateUserProfile(userProfile)) {
        // TODO: Send validation errors to frontend or replicate
        // validation on frontend?
        logger.error('Failed to add user profile, profile is invalid', userProfile.userId)
        throw new Error('Invalid user profile')
      }
      const sanitizedProfile = UserProfileStore.sanitizeUserProfile(userProfile)
      const encEntry = await this.encryptEntry(sanitizedProfile)
      await this.getStore().put(key, encEntry)
      this.nicknameMaps.set(userProfile.userId, userProfile.nickname)
      return encEntry
    } catch (err) {
      logger.error('Failed to add user profile', userProfile.userId, err)
      this.deferredProfiles.push(userProfile)
      throw err
    }
  }

  /**
   * Strips sensitive local path information from user profile metadata.
   * @param userProfile The user profile to sanitize.
   * @returns A sanitized copy of the user profile.
   */
  public static sanitizeUserProfile(userProfile: UserProfile): UserProfile {
    const sanitized = { ...userProfile }
    if (sanitized.profilePhoto) {
      sanitized.profilePhoto = {
        ...sanitized.profilePhoto,
        path: null,
        tmpPath: undefined,
      }
    }
    if (sanitized.fileMetadata) {
      sanitized.fileMetadata = {
        ...sanitized.fileMetadata,
        path: null,
        tmpPath: undefined,
      }
    }
    return sanitized
  }

  /**
   * Validates a user profile, including its photo if present.
   * @param userProfile The user profile to validate.
   * @returns True if valid, false otherwise.
   */
  public static async validateUserProfile(userProfile: UserProfile): Promise<SetUserProfileResponse> {
    try {
      if (userProfile?.photo) {
        const photoValidation = validatePhoto(userProfile.photo ?? '', userProfile.userId)
        if (!photoValidation.success) {
          return { success: false, error: photoValidation.error }
        }
      }
    } catch (err) {
      logger.error('Error validating user profile:', userProfile.userId, err)
      return { success: false, error: 'Internal error: Failed to validate user profile' }
    }
    return { success: true }
  }

  /**
   * Validates a log entry for a user profile in the OrbitDB store.
   * @param entry The log entry to validate.
   * @returns True if valid, false otherwise.
   */
  public async validateEntry(entry: LogEntry<EncryptedAndSignedPayload>): Promise<boolean> {
    try {
      if (entry.payload.op === 'PUT') {
        const encPayload = entry.payload.value!
        const decEntry = await this.decryptEntry(encPayload)

        // Validate that all IDs match
        const key = entry.payload.key
        const valueUserId = encPayload.userId
        const decUserId = decEntry.userId
        const sigAuthor = encPayload.signature.author.name
        if (
          !(
            key &&
            valueUserId &&
            decUserId &&
            sigAuthor &&
            key === valueUserId &&
            key === decUserId &&
            key === sigAuthor
          )
        ) {
          logger.error(
            `Failed to verify user profile entry: ${entry.hash} - key, value.userId, decEntry.userId, and signature.author.name must all match. Got key=${key}, valueUserId=${valueUserId}, decUserId=${decUserId}, sigAuthor=${sigAuthor}`
          )
          return false
        }
        return (await UserProfileStore.validateUserProfile(decEntry)).success
      }
    } catch (err) {
      logger.error('Failed to validate user profile entry:', entry.hash, err)
      return false
    }
    return true
  }

  /**
   * Retrieves and decrypts all user profiles from the store.
   * @returns An array of user profiles.
   */
  public async getUserProfiles(): Promise<UserProfile[]> {
    const encValues = (await this.getStore().all()).map(x => x.value)
    const results = await Promise.all(
      encValues.map(async value => {
        try {
          const decrypted = await this.decryptEntry(value)
          return decrypted
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

  /**
   * Retrieves all encrypted user profile entries from the store.
   * @param ids Optional list of user IDs to filter by.
   * @returns An array of encrypted user profile entries.
   */
  public getEncryptedEntries(): Promise<{ [key: string]: EncryptedAndSignedPayload }>
  public getEncryptedEntries(ids: string[]): Promise<{ [key: string]: EncryptedAndSignedPayload }>
  public async getEncryptedEntries(ids?: string[]): Promise<{ [key: string]: EncryptedAndSignedPayload }> {
    const allEntries = await this.getStore().all()
    const filtered = ids == null ? allEntries : allEntries.filter(entry => ids.includes(entry.key))
    const result: { [key: string]: EncryptedAndSignedPayload } = {}
    for (const entry of filtered) {
      result[entry.key] = entry.value
    }
    return result
  }

  /**
   * Gets the nickname for a given user ID, if available.
   * @param userId The user ID to look up.
   * @returns The nickname or undefined if not found.
   */
  public async getUsername(userId: string): Promise<string | undefined> {
    return this.nicknameMaps.get(userId)
  }

  /**
   * Cleans up the user profiles store by unsetting the store instance.
   */
  public async clean(): Promise<void> {
    logger.info('Cleaning user profiles store')
    this.deferredProfiles = []
    try {
      await this.store?.sync?.stop?.()
      await this.store?.drop?.()
    } catch (err) {
      logger.error('Failed to clean user profiles store:', err)
    }
    this.store = undefined
  }
}
