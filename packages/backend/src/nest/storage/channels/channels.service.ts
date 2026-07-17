import { Inject, Injectable } from '@nestjs/common'
import { Entry, type LogEntry } from '@orbitdb/core'
import { EventEmitter } from 'events'
import {
  ChannelMessage,
  ConnectionProcessInfo,
  type CreateChannelResponse,
  DeleteFilesFromChannelSocketPayload,
  FileMetadata,
  type MessagesLoadedPayload,
  PublicChannel,
  PushNotificationPayload,
  SocketEvents,
  ChannelMessageIdsResponse,
  DeleteChannelResponse,
  CreateChannelPayload,
  ChannelSubscribedPayload,
  DeleteChannelPayload,
  AddMembersChannelPayload,
  AddMembersChannelResponse,
  AddMembersChannelStatus,
  DownloadStatus,
  RemoveDownloadStatus,
  PUBLIC_CHANNEL_METADATA_STORE_NAME,
  PRIVATE_CHANNEL_METADATA_STORE_NAME,
  ChannelOperationStatus,
} from '@quiet/types'
import fs from 'fs'
import { IpfsFileManagerService } from '../../ipfs-file-manager/ipfs-file-manager.service'
import { IPFS_REPO_PATCH, ORBIT_DB_DIR } from '../../const'
import { IpfsFilesManagerEvents } from '../../ipfs-file-manager/ipfs-file-manager.types'
import { createLogger } from '../../common/logger'
import { ChannelRepo } from '../../common/types'
import { StorageEvents } from '../storage.types'
import { OrbitDbService } from '../orbitDb/orbitDb.service'
import { KeyValueIndexedValidated, KeyValueIndexedValidatedType } from '../orbitDb/keyValueIndexedValidated'
import { ChannelStore } from './channel.store'
import { createContextId, ModuleRef } from '@nestjs/core'
import { SigChainService } from '../../auth/sigchain.service'
import { EncryptedAndSignedPayload, EncryptionScope, EncryptionScopeType } from '../../auth/services/crypto/types'
import { RoleName } from '../../auth/services/roles/roles'
import { DateTime } from 'luxon'
import { isChannel } from '../../validation/validators'
import { NotAMemberError } from './channels.errors'
import { SigchainEvents } from '../../auth/types'
import { ChannelMetadataAccessController } from './orbitdb/ChannelMetadataAccessController'
import crypto from 'crypto'

/**
 * Manages storage-level logic for all channels in Quiet
 */
@Injectable()
export class ChannelsService extends EventEmitter {
  // Map of message stores for each public channel where the key is the channel ID
  public channelsRepos: Map<string, ChannelRepo> = new Map()

  // Channel metadata store
  public channels: KeyValueIndexedValidatedType<EncryptedAndSignedPayload> | undefined
  public privateChannels: KeyValueIndexedValidatedType<EncryptedAndSignedPayload> | undefined
  private fileManagerEventsAttached = false
  private sigchainListenerAttached = false
  private channelCreationPromises: Map<string, Promise<ChannelStore>> = new Map()
  private channelMetadataUpdateHandlers: Array<{
    store: KeyValueIndexedValidatedType<EncryptedAndSignedPayload>
    handler: (entry: LogEntry<EncryptedAndSignedPayload>) => void
  }> = []
  private readonly handleSigchainUpdated = async (): Promise<void> => {
    if (!this.channels || !this.privateChannels) {
      return
    }

    try {
      await this.channels.retryIndexingUnindexedEntries()
      await this.privateChannels.retryIndexingUnindexedEntries()
      await this.broadcastCurrentChannels()
    } catch (e) {
      this.logger.warn('Error when attempting to reindex on sigchain update', e)
    }
  }

  // Is the service initialized
  public initialized: boolean = false

  private readonly logger = createLogger(`storage:channels`)

  constructor(
    @Inject(ORBIT_DB_DIR) public readonly orbitDbDir: string,
    @Inject(IPFS_REPO_PATCH) public readonly ipfsRepoPath: string,
    private readonly filesManager: IpfsFileManagerService,
    private readonly orbitDbService: OrbitDbService,
    private readonly moduleRef: ModuleRef,
    private readonly sigchainService: SigChainService,
    private readonly channelMetadataAccessController: ChannelMetadataAccessController
  ) {
    super()
    this._handleEventDownloadProgress = this._handleEventDownloadProgress.bind(this)
    this._handleEventRemoveDownloadStatus = this._handleEventRemoveDownloadStatus.bind(this)
    this._handleEventFileAttached = this._handleEventFileAttached.bind(this)
    this._handleEventMessageMediaUpdated = this._handleEventMessageMediaUpdated.bind(this)
  }

  // Initialization

  /**
   * Initialize the ChannelsService by starting event handles, the file manager, and initializing databases in OrbitDB
   *
   */
  public async init(): Promise<void> {
    if (this.initialized) {
      this.logger.debug(`Skipping duplicate channel init`)
      return
    }

    this.logger.info(`Initializing ${ChannelsService.name}`)

    this.logger.info(`Starting file manager`)
    this.attachFileManagerEvents()
    await this.filesManager.init()

    this.logger.info(`Initializing Channels Databases`)
    await this.initChannels()

    this.logger.info(`Initialized ${ChannelsService.name}`)
    this.initialized = true
  }

  public updateMetadata(metadata: Record<string, any>): void {
    if (this.channels == null || this.privateChannels == null) {
      throw new Error('Channels database must be initialized before updating metadata!')
    }
    OrbitDbService.updateMetadata(this.channels, { ...metadata, isPublic: true })
    OrbitDbService.updateMetadata(this.privateChannels, { ...metadata, isPublic: false })
    for (const repo of this.channelsRepos.values()) {
      repo.store.updateMetadata(metadata)
    }
  }

  /**
   * Initialize the channels management database and individual channel stores in OrbitDB
   */
  private async initChannels(): Promise<void> {
    this.logger.time(`Initializing channel databases`)

    await this.createChannelsDb()
    await this.loadAllChannels()

    this.logger.timeEnd('Initializing channel databases')
    this.logger.info('Initialized databases')
  }

  /**
   * Start syncing the channels management database in OrbitDB
   */
  public async startSync(): Promise<void> {
    await this.channels?.sync.start()
    await this.privateChannels?.sync.start()
    this.logger.info(`Started syncing channels management database`)
  }

  /**
   * Stop syncing the channels management database in OrbitDB
   */
  public async stopSync(): Promise<void> {
    await this.channels?.sync.stop()
    await this.privateChannels?.sync.stop()
  }

  // Channels Database Management

  /**
   * Create the channels management database in OrbitDB
   *
   * NOTE: This also subscribes to all known channel stores and handles update events on the channels management database for
   * subscribing to newly created channel stores.
   */
  public async createChannelsDb(): Promise<void> {
    this.logger.info('Creating channels database')
    this.channels = await this.openChannelsDb()
    this.privateChannels = await this.openPrivateChannelsDb()

    this.attachChannelMetadataUpdateHandler(this.channels)
    this.attachChannelMetadataUpdateHandler(this.privateChannels)

    if (!this.sigchainListenerAttached) {
      this.sigchainService.on(SigchainEvents.UPDATED, this.handleSigchainUpdated)
      this.sigchainListenerAttached = true
    }

    const channels = await this.getChannels()
    this.logger.info('Channels count:', channels.length)
    this.logger.info(
      'Channels names:',
      channels.map(x => x.name)
    )
    for (const channel of channels.values()) {
      await this.subscribeToChannel(channel)
    }
  }

  private attachChannelMetadataUpdateHandler(
    store: KeyValueIndexedValidatedType<EncryptedAndSignedPayload> | undefined
  ): void {
    if (store == null) {
      return
    }
    const handler = (entry: LogEntry<EncryptedAndSignedPayload>) => {
      void this.handleChannelMetadataUpdate(store, entry).catch(e => {
        this.logger.error('Error handling channels database update', e)
      })
    }
    store.events.on('update', handler)
    this.channelMetadataUpdateHandlers.push({ store, handler })
  }

  private detachChannelMetadataUpdateHandlers(): void {
    for (const { store, handler } of this.channelMetadataUpdateHandlers) {
      store.events.off('update', handler)
    }
    this.channelMetadataUpdateHandlers = []
  }

  private isChannelMetadataStoreUpdate(
    store: KeyValueIndexedValidatedType<EncryptedAndSignedPayload>,
    entry: LogEntry<EncryptedAndSignedPayload>
  ): boolean {
    const storeAddress = (store as { address?: string }).address
    const entryStoreAddress = (entry as LogEntry<EncryptedAndSignedPayload> & { id?: string }).id
    return storeAddress != null && entryStoreAddress === storeAddress
  }

  private async handleChannelMetadataUpdate(
    store: KeyValueIndexedValidatedType<EncryptedAndSignedPayload>,
    entry: LogEntry<EncryptedAndSignedPayload>
  ): Promise<void> {
    if (!this.isChannelMetadataStoreUpdate(store, entry)) {
      return
    }

    const channelId = entry.payload?.key
    const operation = entry.payload.op
    this.logger.info('channels database updated', channelId, operation)

    await store.retryIndexingUnindexedEntries()
    this.emit(SocketEvents.CONNECTION_PROCESS_INFO, ConnectionProcessInfo.CHANNELS_STORED)
    await this.broadcastCurrentChannels()
  }

  private async openChannelsDb(): Promise<KeyValueIndexedValidatedType<EncryptedAndSignedPayload>> {
    return await this.openMetadataDb(PUBLIC_CHANNEL_METADATA_STORE_NAME, true, this.validatePublicChannelMetadataEntry)
  }

  private async openPrivateChannelsDb(): Promise<KeyValueIndexedValidatedType<EncryptedAndSignedPayload>> {
    return await this.openMetadataDb(
      PRIVATE_CHANNEL_METADATA_STORE_NAME,
      false,
      this.validatePrivateChannelMetadataEntry
    )
  }

  private async openMetadataDb(
    dbName: string,
    isPublic: boolean,
    validateFunc: typeof this.validatePublicChannelMetadataEntry | typeof this.validatePrivateChannelMetadataEntry
  ): Promise<KeyValueIndexedValidatedType<EncryptedAndSignedPayload>> {
    return await this.orbitDbService.open<KeyValueIndexedValidatedType<EncryptedAndSignedPayload>>(dbName, {
      sync: false,
      Database: KeyValueIndexedValidated(validateFunc.bind(this)),
      AccessController: this.channelMetadataAccessController.createAccessControllerFunc({
        write: ['*'],
        sigchainService: this.sigchainService,
        isPublic,
      }),
    })
  }

  public encryptChannelEntry(payload: PublicChannel): EncryptedAndSignedPayload {
    try {
      const chain = this.sigchainService.getActiveChain()
      let scope: EncryptionScope = {
        type: EncryptionScopeType.ROLE,
        name: RoleName.MEMBER,
      }
      if (!(payload.public ?? true)) {
        scope = {
          type: EncryptionScopeType.ROLE,
          name: chain.channels.generateChannelRoleName(payload.id),
        }
      }
      const encryptedPayload = chain.crypto.encryptAndSign(payload, scope)
      return encryptedPayload
    } catch (err) {
      this.logger.error('Failed to encrypt channel entry:', err)
      throw err
    }
  }

  public decryptChannelEntry(payload: EncryptedAndSignedPayload, id?: string): PublicChannel {
    const chain = this.sigchainService.getActiveChain(false)
    if (chain == null) {
      this.logger.warn(`Can't decrypt channel entry because no active chain was found`)
      throw new Error(`No active chain`)
    }

    if (
      payload.encrypted.scope.type === EncryptionScopeType.ROLE &&
      payload.encrypted.scope.name != null &&
      !chain.roles.amIMemberOfRole(payload.encrypted.scope.name)
    ) {
      this.logger.warn(`Not a member of this channel, skipping channel entry decrypt`)
      throw new NotAMemberError(id)
    }

    try {
      const decryptedPayload = chain.crypto.decryptAndVerify<PublicChannel>(payload.encrypted, payload.signature)
      return decryptedPayload.contents
    } catch (err) {
      this.logger.error('Failed to decrypt channel entry:', err)
      throw err
    }
  }

  private async validateChannelEntryMetadata(
    entry: LogEntry<EncryptedAndSignedPayload>,
    encPayload: EncryptedAndSignedPayload,
    decEntry: PublicChannel,
    expectedPublic: boolean | undefined,
    metadataStore: KeyValueIndexedValidatedType<EncryptedAndSignedPayload> | undefined
  ): Promise<boolean> {
    const key = entry.payload.key
    const sigAuthor = encPayload.signature.author.name
    const chain = this.sigchainService.getActiveChain(false)

    if (chain == null) {
      this.logger.error('Cannot validate channel entry without an active chain:', entry.hash)
      return false
    }

    if (!key || key !== decEntry.id) {
      this.logger.error('Failed to validate channel entry: key must match decrypted channel id:', entry.hash, {
        key,
        channelId: decEntry.id,
      })
      return false
    }

    if (!encPayload.userId || !sigAuthor || encPayload.userId !== sigAuthor) {
      this.logger.error('Failed to validate channel entry: payload userId must match signature author:', entry.hash, {
        userId: encPayload.userId,
        sigAuthor,
      })
      return false
    }

    const writerIdentity = await this.getVerifiedChannelEntryWriter(entry, 'PUT')
    if (writerIdentity == null) {
      return false
    }

    if (writerIdentity.teamId !== chain.team!.id) {
      this.logger.error('Failed to validate channel entry: entry identity team must match active chain:', entry.hash, {
        entryTeamId: writerIdentity.teamId,
        activeTeamId: chain.team!.id,
      })
      return false
    }

    if (decEntry.owner !== sigAuthor) {
      this.logger.error(
        'Failed to validate channel entry: owner must match encrypted payload signature author:',
        entry.hash,
        {
          owner: decEntry.owner,
          encryptedSignatureAuthor: sigAuthor,
        }
      )
      return false
    }

    if (encPayload.teamId !== chain.team!.id) {
      this.logger.error('Failed to validate channel entry: payload teamId must match active chain:', entry.hash, {
        payloadTeamId: encPayload.teamId,
        activeTeamId: chain.team!.id,
      })
      return false
    }

    if (!this.validateChannelPrivacy(entry, decEntry, expectedPublic)) {
      return false
    }

    const writerHasPermissions = expectedPublic
      ? chain.channels.canMemberCreatePublicChannel(writerIdentity.id)
      : chain.channels.canMemberCreatePrivateChannel(writerIdentity.id)
    if (!writerHasPermissions) {
      this.logger.error('Failed to validate channel entry: writer lacks proper permissions', entry.hash, {
        owner: decEntry.owner,
        entrySignatureAuthor: writerIdentity.id,
      })
      return false
    }

    if (!(decEntry.public ?? true)) {
      return this.validatePrivateChannelEntry(entry, encPayload, decEntry, sigAuthor)
    }

    if (decEntry.roleName != null) {
      this.logger.error('Failed to validate public channel entry: public channels cannot declare a role:', entry.hash, {
        roleName: decEntry.roleName,
      })
      return false
    }

    const expectedPrivateRoleName = chain.channels.generateChannelRoleName(decEntry.id)
    if (chain.roles.getAllRoles().some(role => role.roleName === expectedPrivateRoleName)) {
      this.logger.error(
        'Failed to validate public channel entry: channel id already has a private channel role:',
        entry.hash,
        {
          channelId: decEntry.id,
          roleName: expectedPrivateRoleName,
        }
      )
      return false
    }

    return this.validateChannelEncryptionScope(entry, encPayload, RoleName.MEMBER)
  }

  private validatePrivateChannelEntry(
    entry: LogEntry<EncryptedAndSignedPayload>,
    encPayload: EncryptedAndSignedPayload,
    decEntry: PublicChannel,
    sigAuthor: string
  ): boolean {
    if (decEntry.owner !== sigAuthor) {
      this.logger.error('Failed to validate private channel entry: owner must match signature author:', entry.hash, {
        owner: decEntry.owner,
        sigAuthor,
      })
      return false
    }

    const chain = this.sigchainService.getActiveChain()
    const expectedRoleName = chain.channels.generateChannelRoleName(decEntry.id)
    if (decEntry.roleName !== expectedRoleName) {
      this.logger.error('Failed to validate private channel entry: roleName must match channel id:', entry.hash, {
        roleName: decEntry.roleName,
        expectedRoleName,
      })
      return false
    }

    if (!chain.roles.memberHasRole(sigAuthor, expectedRoleName)) {
      this.logger.error('Failed to validate private channel entry: signer must have the channel role:', entry.hash, {
        sigAuthor,
        roleName: expectedRoleName,
      })
      return false
    }

    return this.validateChannelEncryptionScope(entry, encPayload, expectedRoleName)
  }

  private validateChannelEncryptionScope(
    entry: LogEntry<EncryptedAndSignedPayload>,
    encPayload: EncryptedAndSignedPayload,
    expectedRoleName: string
  ): boolean {
    const scope = encPayload.encrypted.scope
    if (scope.type !== EncryptionScopeType.ROLE || scope.name !== expectedRoleName) {
      this.logger.error('Failed to validate channel entry: encryption scope must match channel role:', entry.hash, {
        scope,
        expectedRoleName,
      })
      return false
    }
    return true
  }

  private async getVerifiedChannelEntryWriter(
    entry: LogEntry<EncryptedAndSignedPayload>,
    operation: 'PUT' | 'DEL'
  ): Promise<{ id: string; teamId: string } | undefined> {
    if (!entry.identity) {
      this.logger.error(`Failed to validate channel ${operation} entry: entry identity is missing:`, entry.hash)
      return undefined
    }

    const identities = this.orbitDbService.identities
    if (identities == null) {
      this.logger.error(
        `Failed to validate channel ${operation} entry: OrbitDB identities are not initialized:`,
        entry.hash
      )
      return undefined
    }

    const writerIdentity = await identities.getIdentity(entry.identity)
    const identityVerified = await identities.verifyIdentity(writerIdentity)
    if (!identityVerified) {
      this.logger.error(
        `Failed to validate channel ${operation} entry: entry identity verification failed:`,
        entry.hash
      )
      return undefined
    }

    const entryVerified = await Entry.verify(identities as any, entry)
    if (!entryVerified) {
      this.logger.error(
        `Failed to validate channel ${operation} entry: entry signature verification failed:`,
        entry.hash
      )
      return undefined
    }

    return {
      id: writerIdentity.id,
      teamId: writerIdentity.teamId,
    }
  }

  private async validateChannelOwnership(
    entry: LogEntry<EncryptedAndSignedPayload>,
    decEntry: PublicChannel,
    writerId: string,
    metadataStore: KeyValueIndexedValidatedType<EncryptedAndSignedPayload> | undefined
  ): Promise<boolean> {
    if (metadataStore == null) {
      this.logger.warn(
        'Skipping existing channel ownership check because metadata store is not assigned yet:',
        entry.hash
      )
      return true
    }

    return this.validateExistingChannelMetadataUpdate(entry, decEntry, writerId, metadataStore)
  }

  /**
   * Channel metadata is write-once: the only legitimate PUT for a given channel id is its creation.
   * If an entry already exists for this key, ensure the writer is the original owner and that the
   * security-relevant fields (owner, public flag, role) are unchanged.
   *
   * @param entry The log entry being validated
   * @param decEntry The decrypted channel metadata from the new entry
   * @param writerId The verified id of the entry writer (already pinned to the encrypted signature author and owner)
   * @returns True if this is a fresh channel or a valid update by the original owner
   */
  private async validateExistingChannelMetadataUpdate(
    entry: LogEntry<EncryptedAndSignedPayload>,
    decEntry: PublicChannel,
    writerId: string,
    metadataStore: KeyValueIndexedValidatedType<EncryptedAndSignedPayload>
  ): Promise<boolean> {
    const stored = await metadataStore.get(entry.payload.key!)
    if (stored == null) {
      return true
    }

    // A stored entry that we cannot decrypt (e.g. a private channel we don't belong to) must not be
    // overwritten. decryptChannelEntry throws here and channel metadata validation fails closed.
    const storedChannel = this.decryptChannelEntry(stored as EncryptedAndSignedPayload, entry.payload.key!)

    if (storedChannel.owner !== writerId) {
      this.logger.error(
        'Failed to validate channel entry: only the original owner may modify channel metadata:',
        entry.hash,
        { storedOwner: storedChannel.owner, writerId }
      )
      return false
    }

    if ((storedChannel.public ?? true) !== (decEntry.public ?? true)) {
      this.logger.error('Failed to validate channel entry: channel public flag is immutable:', entry.hash, {
        storedPublic: storedChannel.public,
        newPublic: decEntry.public,
      })
      return false
    }

    if ((storedChannel.roleName ?? null) !== (decEntry.roleName ?? null)) {
      this.logger.error('Failed to validate channel entry: channel role is immutable:', entry.hash, {
        storedRoleName: storedChannel.roleName,
        newRoleName: decEntry.roleName,
      })
      return false
    }

    return true
  }

  private validateChannelPrivacy(
    entry: LogEntry<EncryptedAndSignedPayload>,
    decEntry: PublicChannel,
    expectedPublic: boolean | undefined
  ): boolean {
    if (expectedPublic == null) {
      return true
    }

    const isPrivateChannel = !(decEntry.public ?? true)
    if (expectedPublic && isPrivateChannel) {
      this.logger.error('Failed to validate channel entry: private metadata cannot be stored publicly:', entry.hash, {
        channelId: decEntry.id,
      })
      return false
    }

    if (!expectedPublic && !isPrivateChannel) {
      this.logger.error('Failed to validate channel entry: public metadata cannot be stored privately:', entry.hash, {
        channelId: decEntry.id,
      })
      return false
    }

    return true
  }

  private async validateChannelDeleteEntry(
    entry: LogEntry<EncryptedAndSignedPayload>,
    expectedPublic: boolean
  ): Promise<boolean> {
    const key = entry.payload.key
    if (!key) {
      this.logger.error('Delete channel entry is missing key:', entry.hash)
      return false
    }

    const chain = this.sigchainService.getActiveChain(false)
    if (chain == null) {
      this.logger.error('Cannot validate delete channel entry without an active chain:', entry.hash)
      return false
    }

    const writerIdentity = await this.getVerifiedChannelEntryWriter(entry, 'DEL')
    if (writerIdentity == null) {
      return false
    }

    if (writerIdentity.teamId !== chain.team!.id) {
      this.logger.error(
        'Failed to validate delete channel entry: entry identity team must match active chain:',
        entry.hash,
        {
          entryTeamId: writerIdentity.teamId,
          activeTeamId: chain.team!.id,
        }
      )
      return false
    }

    const writerHasPermissions = expectedPublic
      ? chain.channels.canMemberDeletePublicChannel(writerIdentity.id)
      : chain.channels.canMemberDeletePrivateChannel(writerIdentity.id, entry.key)
    if (!writerHasPermissions) {
      this.logger.error(
        'Failed to validate delete channel entry: writer must have channel deletion permissions on chain:',
        entry.hash,
        {
          writerId: writerIdentity.id,
        }
      )
      return false
    }

    return true
  }

  public async validatePublicChannelMetadataEntry(entry: LogEntry<EncryptedAndSignedPayload>): Promise<boolean> {
    return this.validateChannelMetadataEntry(entry, true, this.channels)
  }

  public async validatePrivateChannelMetadataEntry(entry: LogEntry<EncryptedAndSignedPayload>): Promise<boolean> {
    return this.validateChannelMetadataEntry(entry, false, this.privateChannels)
  }

  private async validateChannelMetadataEntry(
    entry: LogEntry<EncryptedAndSignedPayload>,
    expectedPublic: boolean | undefined,
    metadataStore: KeyValueIndexedValidatedType<EncryptedAndSignedPayload> | undefined
  ): Promise<boolean> {
    try {
      if (entry.payload.op === 'PUT') {
        const encPayload = entry.payload.value!
        const decEntry = this.decryptChannelEntry(encPayload)
        if (!isChannel(decEntry)) {
          this.logger.error('Decrypted channel entry is not a valid channel:', entry.hash, decEntry)
          return false
        }
        if (!(await this.validateChannelEntryMetadata(entry, encPayload, decEntry, expectedPublic, metadataStore))) {
          return false
        }
      }
      if (entry.payload.op === 'DEL') {
        if (!(await this.validateChannelDeleteEntry(entry, expectedPublic ?? true))) {
          return false
        }
      }
    } catch (err) {
      if (err instanceof NotAMemberError || err.message.startsWith('Not a member of this channel')) {
        this.logger.warn(`Failed to decrypt and validate private channel entry, ignoring...`)
        return false
      }
      this.logger.error('Failed to validate channel entry:', entry.hash, err)
      return false
    }
    return true
  }

  private async writerIsAdmin(writerId: string): Promise<boolean> {
    const chain = this.sigchainService.getActiveChain(false)
    if (chain == null) {
      return false
    }

    return chain.roles.memberIsAdmin(writerId)
  }

  /**
   * Broadcasts current channels to any listeners
   */
  public async broadcastCurrentChannels(): Promise<void> {
    const channels = await this.getChannels()

    this.emit(StorageEvents.CHANNELS_STORED, { channels })

    // Try to subscribe to all channels that we haven't subscribed to yet, even if this update event isn't for that
    // particular channel.
    //
    // This fixes a bug where joining a community with multiple channels doesn't initialize all channels immediately.
    for (const channel of channels) {
      if (!this.channelsRepos.get(channel.id)?.subscribed) {
        void this.ensureChannelSubscription(channel).catch(e => {
          this.logger.error(`Can't subscribe to channel ${channel.id}`, e)
        })
      }
    }
  }

  /**
   * Add a channel to the channels management database
   *
   * @param id ID of channel to add to the channels database
   * @param channel Channel configuration metadata
   * @throws Error
   */
  public async setChannel(channel: PublicChannel): Promise<void> {
    if (!this.channels || !this.privateChannels) {
      throw new Error('Channels have not been initialized!')
    }
    const encryptedChannel = this.encryptChannelEntry(channel)
    await this.getMetadataStoreForChannel(channel).put(channel.id, encryptedChannel)
  }

  private getMetadataStoreForChannel(channel: PublicChannel): KeyValueIndexedValidatedType<EncryptedAndSignedPayload> {
    if (channel.public === false) {
      if (this.privateChannels == null) {
        throw new Error('Private channels have not been initialized!')
      }
      return this.privateChannels
    }

    if (this.channels == null) {
      throw new Error('Channels have not been initialized!')
    }
    return this.channels
  }

  /**
   * Read channel metadata by ID from the channels management database
   *
   * @param id ID of channel to fetch
   * @returns Channel metadata, if it exists
   * @throws Error
   */
  public async getChannel(id: string): Promise<PublicChannel | undefined> {
    this.logger.debug('Getting channel', id)
    if (!this.channels || !this.privateChannels) {
      throw new Error('Channels have not been initialized!')
    }

    for (const store of this.getReadableMetadataStores()) {
      const channelEncrypted = await store.get(id)
      if (channelEncrypted == null) {
        continue
      }
      // need to rehydrate the UInt8Array bc json value encoding in KeyValueIndexedValidated does not maintain type
      try {
        return this.decryptChannelEntry(channelEncrypted as EncryptedAndSignedPayload, id)
      } catch (e) {
        if (e instanceof NotAMemberError || e.message.startsWith('Not a member of this channel')) {
          this.logger.warn(`Failed to decrypt and validate private channel entry during getChannel, ignoring...`, id)
        } else {
          this.logger.error('Failed to decrypt channel entry', e)
        }
      }
    }
  }

  private getReadableMetadataStores(): KeyValueIndexedValidatedType<EncryptedAndSignedPayload>[] {
    const stores: KeyValueIndexedValidatedType<EncryptedAndSignedPayload>[] = []
    if (this.channels != null) {
      stores.push(this.channels)
    }
    if (this.privateChannels != null) {
      stores.push(this.privateChannels)
    }
    return stores
  }

  private async generateChannelId(): Promise<string> {
    let id: string
    do {
      id = crypto.randomBytes(16).toString('hex')
    } while (this.channelsRepos.has(id) || (await this.getChannel(id)) != null)
    return id
  }

  /**
   * Read entries for all keys in the channels management database
   *
   * @returns All channel metadata in the channels management database
   * @throws Error
   */
  public async getChannels(): Promise<PublicChannel[]> {
    this.logger.debug('Getting channels')
    if (!this.channels || !this.privateChannels) {
      throw new Error('Channels have not been initialized!')
    }
    const channelsById = new Map<string, PublicChannel>()
    for (const store of this.getReadableMetadataStores()) {
      const entries = await store.all()
      for (const x of entries) {
        try {
          this.logger.debug('Decrypting channel entry', x.key)
          channelsById.set(x.key, this.decryptChannelEntry(x.value, x.key))
        } catch (e) {
          if (e instanceof NotAMemberError || e.message.startsWith('Not a member of this channel')) {
            this.logger.warn(
              `Failed to decrypt and validate private channel entry during getChannels, ignoring...`,
              x.key
            )
          } else {
            this.logger.error('Failed to decrypt channel entry', e)
          }
        }
      }
    }
    return [...channelsById.values()]
  }

  /**
   * Maps metadata records for private channels to their LFA role name
   *
   * @returns Map of private channels to their role names
   * @throws Error
   */
  public async getPrivateChannelsByRolename(): Promise<Record<string, PublicChannel>> {
    if (!this.channels || !this.privateChannels) {
      throw new Error('Channels have not been initialized!')
    }
    const channels = await this.getChannels()
    const channelMapping: { [channelRoleName: string]: PublicChannel } = {}
    channels.forEach((channel: PublicChannel) => {
      if (!(channel.public ?? true) && channel.roleName != null) {
        channelMapping[channel.roleName] = channel
      }
    })
    return channelMapping
  }

  /**
   * Get all known channels and emit event with metadata
   *
   * @emits StorageEvents.CHANNELS_STORED
   */
  public async loadAllChannels(): Promise<void> {
    this.logger.info('Getting all channels')
    this.emit(StorageEvents.CHANNELS_STORED, {
      channels: await this.getChannels(),
    })
  }

  // Channel Management

  /**
   * Create a new ChannelStore and, optionally, add the metadata to the channels management database
   *
   * @param channelData Channel metadata for new channel
   * @returns Newly created ChannelStore
   */
  public async createChannel(channelData: PublicChannel): Promise<ChannelStore> {
    const channelId = channelData.id
    const creationPromise = this.channelCreationPromises.get(channelId)
    if (creationPromise) {
      return await creationPromise
    }

    const existingRepo = this.channelsRepos.get(channelId)
    if (existingRepo) {
      this.logger.info(`Channel ${channelId} already has a local repo`)
      return existingRepo.store
    }

    const nextCreationPromise = this.createChannelWithRepo(channelData).finally(() => {
      this.channelCreationPromises.delete(channelId)
    })
    this.channelCreationPromises.set(channelId, nextCreationPromise)
    return await nextCreationPromise
  }

  private async createChannelWithRepo(channelData: PublicChannel): Promise<ChannelStore> {
    this.logger.info(`Creating channel`, channelData.id, channelData.name)

    const channelId = channelData.id
    const store = await this.createChannelStore(channelData)

    this.channelsRepos.set(channelId, {
      store,
      eventsAttached: false,
      subscribed: false,
      public: channelData.public ?? true,
    })
    this.logger.info(`Set ${channelId} to local channels`)

    try {
      const channel = await this.getChannel(channelId)
      if (channel == undefined) {
        await this.setChannel(channelData)
      } else {
        this.logger.info(`Channel ${channelId} already exists`)
      }
    } catch (e) {
      this.channelsRepos.delete(channelId)
      throw e
    }

    this.logger.info(`Created channel ${channelId}`)

    return store
  }

  /**
   * Helper method for creating and initializing ChannelStore
   *
   * @param channelData Channel metadata for new channel
   * @returns Newly created ChannelStore
   */
  private async createChannelStore(channelData: PublicChannel): Promise<ChannelStore> {
    let store = await this.moduleRef.create(ChannelStore, createContextId())
    store = await store.init(channelData, { sync: false })
    store.updateMetadata({ teamId: this.sigchainService.team.id })
    return store
  }

  /**
   * Handle create channel event from frontend and create a new channel store
   *
   * @param payload Payload containing metadata for new channel
   * @returns Response containing metadata for new channel
   */
  public async handleCreateChannel(payload: CreateChannelPayload): Promise<CreateChannelResponse> {
    const id = await this.generateChannelId()
    const sigChain = this.sigchainService.getActiveChain()
    const channelData: PublicChannel = {
      id: id,
      name: payload.name,
      description: payload.description ?? '',
      owner: sigChain.user.userId,
      timestamp: DateTime.utc().valueOf(),
      public: payload.public ?? true,
      teamId: payload.teamId,
    }
    let roleName: string | undefined = undefined
    if (!(channelData.public ?? true)) {
      if (!sigChain.channels.canICreatePrivateChannel()) {
        throw new Error('User is missing permissions to create private channels')
      }
      roleName = sigChain.channels.create(channelData.id)
      channelData.roleName = roleName
    } else {
      if (!sigChain.channels.canICreatePublicChannel()) {
        throw new Error('User is missing permissions to create public channels')
      }
    }
    const store = await this.createChannel(channelData)
    if (!store) {
      throw new Error('Failed to create channel')
    }
    await this.ensureChannelSubscription(channelData)
    return { channel: channelData, status: ChannelOperationStatus.SUCCESS }
  }

  /**
   * Creates a new channel store with the supplied metadata, if it doesn't exist, and subscribes
   * to new events on the store, if it didn't already exist.
   *
   * NOTE: Storage events like MESSAGE_IDS_STORED are consumed up the chain on this service but are
   * emitted on the ChannelStore instances so we consume and re-emit them on this service's event
   * emitter.
   *
   * @param channelData Channel metadata for channel we are subscribing to
   * @returns CreateChannelResponse
   * @emits StorageEvents.CHANNEL_SUBSCRIBED
   */
  public async subscribeToChannel(channelData: PublicChannel): Promise<CreateChannelResponse | undefined> {
    const channel = this.normalizeChannelData(channelData)
    const repo = await this.ensureChannelSubscription(channel)
    if (!repo) return

    return { channel, status: ChannelOperationStatus.SUCCESS }
  }

  private normalizeChannelData(channelData: PublicChannel): PublicChannel {
    const channelWithAddress = channelData as PublicChannel & { address?: string }
    if (channelWithAddress.address) {
      return {
        ...channelData,
        id: channelWithAddress.address,
      }
    }
    return channelData
  }

  private async ensureChannelRepo(channelData: PublicChannel): Promise<ChannelRepo | undefined> {
    let repo = this.channelsRepos.get(channelData.id)
    if (repo) {
      return repo
    }

    try {
      await this.createChannel(channelData)
    } catch (e) {
      this.logger.error(`Can't subscribe to channel ${channelData.id}`, e)
      return
    }

    repo = this.channelsRepos.get(channelData.id)
    if (!repo) {
      this.logger.error(`Can't subscribe to channel ${channelData.id}, the DB isn't initialized!`)
      return
    }
    return repo
  }

  private async ensureChannelSubscription(channelData: PublicChannel): Promise<ChannelRepo | undefined> {
    const channel = this.normalizeChannelData(channelData)
    const repo = await this.ensureChannelRepo(channel)
    if (!repo) return
    if (repo.subscribed) return repo

    if (!repo.subscriptionPromise) {
      repo.subscriptionPromise = this.subscribeChannelRepo(channel.id, repo).finally(() => {
        repo.subscriptionPromise = undefined
      })
    }

    await repo.subscriptionPromise
    return repo
  }

  private async subscribeChannelRepo(channelId: string, repo: ChannelRepo): Promise<void> {
    if (!repo.eventsAttached) {
      this.handleMessageEventsOnChannelStore(channelId, repo)
      repo.eventsAttached = true
    }

    await repo.store.subscribe()
    repo.subscribed = true

    this.logger.info(`Subscribed to channel ${channelId}`)
    this.emit(StorageEvents.CHANNEL_SUBSCRIBED, {
      channelId,
    } as ChannelSubscribedPayload)
  }

  /**
   * Capture events emitted by individual channel stores and re-emit on the channels service
   *
   * @param channelId ID of channel to re-emit events from
   * @param repo Repo containing the store we are re-emitting events from
   * @emits StorageEvents.MESSAGE_IDS_STORED
   * @emits StorageEvents.MESSAGES_STORED
   * @emits StorageEvents.SEND_PUSH_NOTIFICATION
   */
  private handleMessageEventsOnChannelStore(channelId: string, repo: ChannelRepo): void {
    this.logger.info(`Subscribing to channel updates`, channelId)
    repo.store.on(StorageEvents.MESSAGE_IDS_STORED, (payload: ChannelMessageIdsResponse) => {
      this.emit(StorageEvents.MESSAGE_IDS_STORED, payload)
    })

    repo.store.on(StorageEvents.MESSAGES_STORED, (payload: MessagesLoadedPayload) => {
      this.emit(StorageEvents.MESSAGES_STORED, payload)
    })

    repo.store.on(StorageEvents.SEND_PUSH_NOTIFICATION, (payload: PushNotificationPayload) => {
      this.emit(StorageEvents.SEND_PUSH_NOTIFICATION, payload)
    })
  }

  /**
   * Get the store for a given channel ID and, optionally, create a temporary store if it doesn't exist then drop
   * the database from OrbitDB
   *
   * @param payload Metadata on the channel to be deleted
   * @returns Response containing metadata on the channel that was deleted
   * @throws Error
   */
  public async deleteChannel(payload: DeleteChannelPayload): Promise<DeleteChannelResponse> {
    this.logger.info('Attempting to delete channel', payload)
    const { channelId } = payload
    const channel = await this.getChannel(channelId)
    if (!channel) {
      this.logger.error(`Channel ${channelId} not found`)
      return { channelId, deleted: true } as DeleteChannelResponse
    }
    const iCanDeleteChannel =
      (channel.public ?? true)
        ? this.sigchainService.activeChain.channels.canIDeletePublicChannel()
        : this.sigchainService.activeChain.channels.canIDeletePrivateChannel(channelId)
    // NOTE: this doesn't prevent other users from deleting channels they don't own if they modify the client
    // TODO: invalidate removals from non-owners
    if (iCanDeleteChannel) {
      await this.deleteChannelMetadata(channelId)
    } else {
      this.logger.error(`User is not allowed to delete channel ${channelId}`)
      return { channelId, deleted: false } as DeleteChannelResponse
    }

    const repo = this.channelsRepos.get(channelId)
    let store = repo?.store
    // TODO: do we really need to create a temporary store if it doesn't exist?
    if (store == null) {
      const channelData: PublicChannel = channel ?? {
        id: channelId,
        name: 'undefined',
        owner: this.sigchainService.getActiveChain().user.userId,
        description: 'undefined',
        timestamp: DateTime.utc().valueOf(),
      }
      store = await this.createChannelStore(channelData)
    }
    await store.deleteChannel()
    this.channelsRepos.delete(channelId)
    return { channelId, deleted: true } as DeleteChannelResponse
  }

  private async deleteChannelMetadata(channelId: string): Promise<void> {
    if (this.channels == null || this.privateChannels == null) {
      throw new Error('Channels have not been initialized!')
    }

    await this.channels.del(channelId)
    await this.privateChannels.del(channelId)
  }

  public async addMembersToPrivateChannel(payload: AddMembersChannelPayload): Promise<AddMembersChannelResponse> {
    const { channelId, channelName, memberIds } = payload
    this.logger.info(`Adding ${memberIds.length} members to private channel`, channelId, channelName)

    const channel = await this.getChannel(channelId)
    if (!channel) {
      this.logger.error(`Channel ${channelId} not found!`)
      return { channelId, status: AddMembersChannelStatus.CHANNEL_MISSING }
    }

    if (channel.public ?? true) {
      this.logger.error(`Attempted to add members to public channel ${channelId}`)
      return { channelId, status: AddMembersChannelStatus.INVALID_CHANNEL_TYPE }
    }

    const isMemberOfChannel = this.sigchainService.activeChain.channels.amIMemberOfChannel(channelId)
    if (!isMemberOfChannel) {
      this.logger.error(`You are not a member of private channel ${channelId}, cannot add members!`)
      return { channelId, status: AddMembersChannelStatus.NOT_MEMBER }
    }

    const canAddMembers = this.sigchainService.activeChain.channels.canIAddMembersToPrivateChannel(channelId)
    if (!canAddMembers) {
      this.logger.error(`You don't have permission to add members to private channel ${channelId}!`)
      return { channelId, status: AddMembersChannelStatus.NOT_PERMITTED }
    }

    const repo = this.channelsRepos.get(channelId)
    const store = repo?.store
    if (store == null) {
      this.logger.error(`No channel store for private channel ${channelId}, cannot add members!`)
      return { channelId, status: AddMembersChannelStatus.CHANNEL_MISSING }
    }

    this.logger.info(`Updating private channel membership`, channelId)
    for (const memberId of memberIds) {
      if (this.sigchainService.activeChain.channels.memberInChannel(memberId, channelId)) {
        this.logger.debug('User already in channel', memberId, channelId)
        continue
      }
      this.sigchainService.activeChain.channels.addMember(memberId, channelId)
    }
    this.logger.info(`Private channel membership updated`, channelId)
    return { channelId, status: AddMembersChannelStatus.SUCCESS }
  }

  // Messages

  /**
   * Sends a message on a given channel if that channel is known
   *
   * @param message Message to send
   */
  public async sendMessage(message: ChannelMessage): Promise<boolean> {
    this.logger.info('Sending message', message)
    let repo = this.channelsRepos.get(message.channelId)
    if (!repo?.subscribed) {
      const channel = await this.getChannel(message.channelId)
      if (channel == null) {
        this.logger.error(`Could not send message. No '${message.channelId}' channel in saved public channels`)
        return false
      }
      repo = await this.ensureChannelSubscription(channel)
    }

    if (repo == null) {
      this.logger.error(`Could not send message. No '${message.channelId}' channel in saved public channels`)
      return false
    }

    return await repo.store.sendMessage(message)
  }

  /**
   * Read messages for a list of message IDs from a given channel if that channel is known
   *
   * @param channelId ID of channel to read messages from
   * @param ids IDS of messages to read
   * @returns Payload containing messages read
   */
  public async getMessages(
    channelId: string,
    messageIds: string[] | undefined = undefined
  ): Promise<MessagesLoadedPayload | undefined> {
    const repo = this.channelsRepos.get(channelId)
    if (repo == null) {
      this.logger.error(`Could not read messages. No '${channelId}' channel in saved public channels`)
      return
    }

    return await repo.store.getMessages(messageIds)
  }

  // Files

  /**
   * Delete multiple files from the file manager
   *
   * @param files List of file metadata to be deleted
   */
  public async deleteChannelFiles(files: FileMetadata[]): Promise<void> {
    for (const file of files) {
      await this.deleteFile(file)
    }
  }

  /**
   * Deleted a single file from the file manager
   *
   * @param fileMetadata Metadata of file to be deleted
   */
  public async deleteFile(fileMetadata: FileMetadata): Promise<void> {
    await this.filesManager.deleteBlocks(fileMetadata)
  }

  // File manager event emitter handler functions

  private _handleEventDownloadProgress = (payload: DownloadStatus): void => {
    this.emit(StorageEvents.DOWNLOAD_PROGRESS, payload)
  }

  private _handleEventMessageMediaUpdated = (payload: FileMetadata): void => {
    this.emit(StorageEvents.MESSAGE_MEDIA_UPDATED, payload)
  }

  private _handleEventRemoveDownloadStatus = (payload: RemoveDownloadStatus): void => {
    this.emit(StorageEvents.REMOVE_DOWNLOAD_STATUS, payload)
  }

  private _handleEventFileAttached = (payload: FileMetadata): void => {
    this.emit(StorageEvents.FILE_ATTACHED, payload)
  }

  /**
   * Consume file manager events and emit storage events on the channels service
   *
   * @emits StorageEvents.MESSAGE_MEDIA_UPDATED
   * @emits StorageEvents.REMOVE_DOWNLOAD_STATUS
   * @emits StorageEvents.FILE_ATTACHED
   * @emits StorageEvents.DOWNLOAD_PROGRESS
   */
  private attachFileManagerEvents(): void {
    if (this.fileManagerEventsAttached) {
      return
    }
    this.logger.info(`Attaching file manager event listeners on channels service`)
    this.filesManager.on(IpfsFilesManagerEvents.DOWNLOAD_PROGRESS, this._handleEventDownloadProgress)
    this.filesManager.on(IpfsFilesManagerEvents.MESSAGE_MEDIA_UPDATED, this._handleEventMessageMediaUpdated)
    this.filesManager.on(StorageEvents.REMOVE_DOWNLOAD_STATUS, this._handleEventRemoveDownloadStatus)
    this.filesManager.on(StorageEvents.FILE_ATTACHED, this._handleEventFileAttached)
    this.filesManager.on(StorageEvents.DOWNLOAD_PROGRESS, this._handleEventDownloadProgress)
    this.filesManager.on(StorageEvents.MESSAGE_MEDIA_UPDATED, this._handleEventMessageMediaUpdated)
  }

  /**
   * Removes file manager event listeners
   */
  public detachFileManagerEvents(): void {
    this.logger.info(`Detaching file manager event listeners on channels service`)
    this.filesManager.off(IpfsFilesManagerEvents.DOWNLOAD_PROGRESS, this._handleEventDownloadProgress)
    this.filesManager.off(IpfsFilesManagerEvents.MESSAGE_MEDIA_UPDATED, this._handleEventMessageMediaUpdated)
    this.filesManager.off(StorageEvents.REMOVE_DOWNLOAD_STATUS, this._handleEventRemoveDownloadStatus)
    this.filesManager.off(StorageEvents.FILE_ATTACHED, this._handleEventFileAttached)
    this.filesManager.off(StorageEvents.DOWNLOAD_PROGRESS, this._handleEventDownloadProgress)
    this.filesManager.off(StorageEvents.MESSAGE_MEDIA_UPDATED, this._handleEventMessageMediaUpdated)
  }

  /**
   * Emit event to trigger file attachment on file manager
   *
   * @param metadata Metadata of file to be uploaded
   * @emits IpfsFilesManagerEvents.ATTACH_FILE
   */
  public async attachFile(metadata: FileMetadata): Promise<void> {
    this.filesManager.emit(IpfsFilesManagerEvents.ATTACH_FILE, metadata)
  }

  /**
   * Emit event to trigger file download on file manager
   *
   * @param metadata Metadata of file to be downloaded
   * @emits IpfsFilesManagerEvents.DOWNLOAD_FILE
   */
  public async downloadFile(metadata: FileMetadata): Promise<void> {
    this.filesManager.emit(IpfsFilesManagerEvents.DOWNLOAD_FILE, metadata)
  }

  /**
   * Emit event to trigger file download cancellation on file manager
   *
   * @param metadata Metadata of file to be cancelled
   * @emits IpfsFilesManagerEvents.CANCEL_DOWNLOAD
   */
  public cancelDownload(mid: string): void {
    this.filesManager.emit(IpfsFilesManagerEvents.CANCEL_DOWNLOAD, mid)
  }

  /**
   * Delete files for a list of messages
   *
   * @param payload Payload containing file messages whose files should be deleted
   */
  public async deleteFilesFromChannel(payload: DeleteFilesFromChannelSocketPayload): Promise<void> {
    const { messages } = payload
    Object.keys(messages).map(async key => {
      const message = messages[key]
      if (message?.media?.path) {
        const mediaPath = message.media.path
        this.logger.info('deleteFilesFromChannel : mediaPath', mediaPath)
        const isFileExist = await this.checkIfFileExist(mediaPath)
        this.logger.info(`deleteFilesFromChannel : isFileExist- ${isFileExist}`)
        if (isFileExist) {
          fs.unlink(mediaPath, unlinkError => {
            if (unlinkError) {
              this.logger.error(`deleteFilesFromChannel : unlink error`, unlinkError)
            }
          })
        } else {
          this.logger.error(`deleteFilesFromChannel : file does not exist`, mediaPath)
        }
      }
    })
  }

  /**
   * Check if the file with the supplied path exists on the file system
   *
   * @param filePath Path to file
   * @returns True if file exists at the path
   */
  public async checkIfFileExist(filePath: string): Promise<boolean> {
    this.logger.info(`Checking if ${filePath} exists`)
    return fs.existsSync(filePath)
  }

  // Close Logic

  /**
   * Close the channels management database on OrbitDB and each channel's DB
   */
  public async closeChannels(): Promise<void> {
    this.detachChannelMetadataUpdateHandlers()
    this.channelCreationPromises.clear()
    const channels = this.channels
    const privateChannels = this.privateChannels
    const channelsRepos = this.channelsRepos
    this.channels = undefined
    this.privateChannels = undefined
    this.channelsRepos = new Map()

    this.logger.info('Closing channels DB')
    await this.closeMetadataStore('public', channels)
    await this.closeMetadataStore('private', privateChannels)
    this.logger.info('Closed channels DB')

    this.logger.info(`Closing each channel's DB`)
    for (const [channelId, channel] of channelsRepos.entries()) {
      try {
        this.logger.info(`Closing ${channelId} DB`)
        await channel.store.close()
        this.logger.info(`Close ${channelId} DB`)
      } catch (e) {
        this.logger.error(`Error closing ${channelId} DB`, e)
      }
    }
  }

  /**
   * Stop the file manager
   */
  public async closeFileManager(): Promise<void> {
    try {
      this.logger.info('Stopping IPFS files manager')
      await this.filesManager.stop()
    } catch (e) {
      this.logger.error('Error stopping IPFS files manager', e)
    }
  }

  /**
   * Close the channels service
   */
  public async close(): Promise<void> {
    this.initialized = false
    this.detachFileManagerEvents()
    await this.closeFileManager()
    await this.closeChannels()
  }

  /**
   * Clean the ChannelsService
   *
   * NOTE: Does NOT affect data stored in IPFS
   */
  public async clean(): Promise<void> {
    this.initialized = false
    this.detachFileManagerEvents()
    this.detachChannelMetadataUpdateHandlers()
    this.channelCreationPromises.clear()
    const channels = this.channels
    const privateChannels = this.privateChannels
    const channelsRepos = this.channelsRepos
    this.channels = undefined
    this.privateChannels = undefined
    this.channelsRepos = new Map()

    this.logger.info('Cleaning channels DB')
    await this.cleanMetadataStore('public', channels)
    await this.cleanMetadataStore('private', privateChannels)

    for (const [channelId, channel] of channelsRepos.entries()) {
      try {
        this.logger.info(`Cleaning ${channelId} DB`)
        await channel.store.clean()
      } catch (e) {
        this.logger.error(`Error cleaning ${channelId} DB`, e)
      }
    }
  }

  private async closeMetadataStore(
    label: string,
    store: KeyValueIndexedValidatedType<EncryptedAndSignedPayload> | undefined
  ): Promise<void> {
    if (store == null) {
      return
    }

    try {
      await store.sync?.stop?.()
    } catch (e) {
      // If the sync is not started, this will throw an error
    }

    try {
      await store.close()
    } catch (e) {
      this.logger.error(`Error closing ${label} channels DB`, e)
    }
  }

  private async cleanMetadataStore(
    label: string,
    store: KeyValueIndexedValidatedType<EncryptedAndSignedPayload> | undefined
  ): Promise<void> {
    if (store == null) {
      return
    }

    try {
      await store.sync?.stop?.()
    } catch (e) {
      // If the sync is not started, this will throw an error
    }

    try {
      await store.drop?.()
    } catch (e) {
      this.logger.error(`Error dropping ${label} channels DB`, e)
    }

    try {
      await store.close()
    } catch (e) {
      this.logger.error(`Error closing ${label} channels DB after drop`, e)
    }
  }
}
