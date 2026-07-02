import { Injectable } from '@nestjs/common'
import { type LogEntry, IPFSAccessController } from '@orbitdb/core'
import { PushNotificationTokens } from '@quiet/types'

import { createLogger } from '../../common/logger'
import { OrbitDbService } from '../orbitDb/orbitDb.service'
import { StorageEvents } from '../storage.types'
import { KeyValueIndexedValidated, type KeyValueIndexedValidatedType } from '../orbitDb/keyValueIndexedValidated'
import { EncryptedKeyValueIndexedValidatedStoreBase } from '../base.store'
import { EncryptedAndSignedPayload, EncryptionScopeType } from '../../auth/services/crypto/types'
import { SigChainService } from '../../auth/sigchain.service'
import { RoleName } from '../../auth/services/roles/roles'
import { SigchainEvents } from '../../auth/types'

const logger = createLogger('NotificationTokensStore')

// TODO: when we support device linking, increase to the number of linked devices we want to allow per user
export const MAX_TOKENS_PER_USER = 1

@Injectable()
export class NotificationTokensStore extends EncryptedKeyValueIndexedValidatedStoreBase<
  EncryptedAndSignedPayload,
  PushNotificationTokens
> {
  private deferredEntries: PushNotificationTokens[] = []

  constructor(
    private readonly orbitDbService: OrbitDbService,
    private readonly auth: SigChainService
  ) {
    super()
    this.auth.on(SigchainEvents.UPDATED, this.handleAuthUpdated)
  }

  public async init() {
    logger.info('Initializing notification tokens key/value store')
    // TODO: when removal is supported, we should rotate the store address with key generation to avoid stale entries hanging around indefinitely
    this.store = await this.orbitDbService.open<KeyValueIndexedValidatedType<EncryptedAndSignedPayload>>(
      'notification-tokens',
      {
        type: 'KeyValueIndexedValidated',
        sync: false,
        Database: KeyValueIndexedValidated(this.validateEntry.bind(this)),
        AccessController: IPFSAccessController({ write: ['*'] }),
      }
    )

    this.store.events.on('update', (_entry: LogEntry) => {
      this.getAllEntries().then((entries: PushNotificationTokens[]) => {
        this.emit(StorageEvents.NOTIFICATION_TOKENS_STORED, { entries })
      })
    })

    await this.store!.retryIndexingUnindexedEntries()

    this.emit(StorageEvents.NOTIFICATION_TOKENS_STORED, {
      entries: await this.getAllEntries(),
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
      logger.error('Failed to update notification tokens:', err)
    }
  }

  public async startSync() {
    await this.getStore().sync.start()
    await this.flushDeferredEntries()
  }

  public async flushDeferredEntries() {
    if (this.deferredEntries.length === 0) {
      return
    }
    if (!this.auth.team) {
      logger.info('No team found, cannot flush deferred notification tokens')
      return
    }
    if (!this.auth.team.memberHasRole(this.auth.user.userId, RoleName.MEMBER)) {
      logger.warn('User does not have permission to write notification tokens')
      return
    }
    logger.info('Flushing deferred notification tokens:', this.deferredEntries.length)

    const entriesToFlush = [...this.deferredEntries]
    this.deferredEntries = []

    for (const entry of entriesToFlush) {
      try {
        await this.setEntry(entry.userId, entry)
      } catch (err) {
        logger.error('Failed to flush deferred notification token:', entry.userId, err)
      }
    }
  }

  public async encryptEntry(payload: PushNotificationTokens): Promise<EncryptedAndSignedPayload> {
    try {
      return this.auth.crypto.encryptAndSign(payload, {
        type: EncryptionScopeType.ROLE,
        name: RoleName.MEMBER,
      })
    } catch (err) {
      logger.error('Failed to encrypt notification token entry:', err)
      throw err
    }
  }

  public async decryptEntry(payload: EncryptedAndSignedPayload): Promise<PushNotificationTokens> {
    try {
      const result = this.auth.crypto.decryptAndVerify<PushNotificationTokens>(payload.encrypted, payload.signature)
      if (!result.isValid) {
        throw new Error('Invalid signature on notification token entry')
      }
      return result.contents
    } catch (err) {
      logger.error('Failed to decrypt notification token entry:', err)
      throw err
    }
  }

  public async getEntry(key: string): Promise<PushNotificationTokens> {
    const entry = await this.getStore().get(key)
    if (!entry) {
      throw new Error(`Notification token entry not found for key ${key}`)
    }
    return this.decryptEntry(entry)
  }

  public async setEntry(key: string, value: PushNotificationTokens): Promise<EncryptedAndSignedPayload> {
    try {
      const encEntry = await this.encryptEntry(value)
      await this.getStore().put(key, encEntry)
      return encEntry
    } catch (err) {
      logger.error('Failed to set notification token entry:', key, err)
      this.deferredEntries.push(value)
      throw err
    }
  }

  public async tombstoneUser(userId: string): Promise<string> {
    const myEntry = await this.getStore().get(userId)
    if (!myEntry) {
      logger.info(`No existing notification token entry found for user ${userId}, must skip tombstone`)
      return ''
    }

    const tombstoneEntry: PushNotificationTokens = { userId, tokens: [] }

    try {
      const encEntry = await this.encryptEntry(tombstoneEntry)
      const hash = await this.getStore().put(userId, encEntry)
      return hash
    } catch (err) {
      logger.error('Failed to tombstone notification token entry:', userId, err)
      this.deferredEntries.push(tombstoneEntry)
      throw err
    }
  }

  /**
   * Appends a UCAN token for a user, enforcing a max of MAX_TOKENS_PER_USER.
   * Deduplicates by exact string match. Evicts oldest tokens when at capacity.
   */
  public async addToken(userId: string, ucan: string): Promise<void> {
    let existing: PushNotificationTokens
    try {
      existing = await this.getEntry(userId)
    } catch {
      existing = { userId, tokens: [] }
    }

    if (existing.tokens.includes(ucan)) {
      logger.debug(`UCAN token already exists for user ${userId}, skipping add`)
      return
    }

    existing.tokens.push(ucan)

    // Evict oldest tokens if over limit
    if (existing.tokens.length > MAX_TOKENS_PER_USER) {
      existing.tokens = existing.tokens.slice(-MAX_TOKENS_PER_USER)
    }

    await this.setEntry(userId, existing)
  }

  public async getAllEntries(): Promise<PushNotificationTokens[]> {
    const encValues = (await this.getStore().all()).map(x => x.value)
    const results = await Promise.all(
      encValues.map(async value => {
        try {
          return await this.decryptEntry(value)
        } catch (error) {
          logger.error('Failed to decrypt notification token entry:', error)
          return null
        }
      })
    )
    return results.filter((entry): entry is PushNotificationTokens => entry !== null)
  }

  public async validateEntry(entry: LogEntry<EncryptedAndSignedPayload>): Promise<boolean> {
    try {
      if (entry.payload.op === 'PUT') {
        const encPayload = entry.payload.value!
        const decEntry = await this.decryptEntry(encPayload)

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
            `Failed to verify notification token entry: ${entry.hash} - ID mismatch. key=${key}, valueUserId=${valueUserId}, decUserId=${decUserId}, sigAuthor=${sigAuthor}`
          )
          return false
        }

        if (!Array.isArray(decEntry.tokens) || !decEntry.tokens.every(t => typeof t === 'string')) {
          logger.error(`Failed to verify notification token entry: ${entry.hash} - tokens must be string[]`)
          return false
        }

        if (decEntry.tokens.length > MAX_TOKENS_PER_USER) {
          logger.error(
            `Failed to verify notification token entry: ${entry.hash} - exceeds max ${MAX_TOKENS_PER_USER} tokens`
          )
          return false
        }

        return true
      }
    } catch (err) {
      logger.error('Failed to validate notification token entry:', entry.hash, err)
      return false
    }
    return true
  }

  public async clean(): Promise<void> {
    logger.info('Cleaning notification tokens store')
    this.deferredEntries = []
    try {
      await this.store?.sync?.stop?.()
      await this.store?.drop?.()
    } catch (err) {
      logger.error('Failed to clean notification tokens store:', err)
    }
    this.store = undefined
  }
}
