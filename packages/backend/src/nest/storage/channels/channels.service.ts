import { Inject, Injectable } from '@nestjs/common'
import { IPFSAccessController, type LogEntry } from '@orbitdb/core'
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
  ConsumedChannelMessage,
  AddMembersChannelPayload,
  AddMembersChannelResponse,
  AddMembersChannelStatus,
  DownloadStatus,
  RemoveDownloadStatus,
  CHANNEL_METADATA_STORE_NAME,
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

/**
 * Manages storage-level logic for all channels in Quiet
 */
@Injectable()
export class ChannelsService extends EventEmitter {
  // Map of message stores for each public channel where the key is the channel ID
  public channelsRepos: Map<string, ChannelRepo> = new Map()

  // Channel metadata store
  public channels: KeyValueIndexedValidatedType<EncryptedAndSignedPayload> | undefined
  private fileManagerEventsAttached = false
  private sigchainListenerAttached = false
  private readonly handleSigchainUpdated = async (): Promise<void> => {
    if (!this.channels) {
      return
    }

    try {
      const currentChannelsCount = (await this.getChannels()).length
      await this.channels.retryIndexingUnindexedEntries()
      const newChannelsCount = (await this.getChannels()).length
      if (currentChannelsCount !== newChannelsCount) {
        await this.broadcastCurrentChannels()
      }
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
    private readonly sigchainService: SigChainService
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
    if (this.channels == null) {
      throw new Error('Channels database must be initialized before updating metadata!')
    }
    OrbitDbService.updateMetadata(this.channels, metadata)
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
    this.logger.info(`Started syncing channels management database`)
  }

  /**
   * Stop syncing the channels management database in OrbitDB
   */
  public async stopSync(): Promise<void> {
    await this.channels?.sync.stop()
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
    this.channels = await this.orbitDbService.open<KeyValueIndexedValidatedType<EncryptedAndSignedPayload>>(
      CHANNEL_METADATA_STORE_NAME,
      {
        sync: false,
        Database: KeyValueIndexedValidated(this.validateEntry.bind(this)),
        AccessController: IPFSAccessController({ write: ['*'] }),
      }
    )

    this.channels.events.on('update', (entry: LogEntry<ConsumedChannelMessage>) => {
      const channelId = entry.payload?.value?.channelId
      const operation = entry.payload.op
      this.logger.info('channels database updated', channelId, operation)

      this.emit(SocketEvents.CONNECTION_PROCESS_INFO, ConnectionProcessInfo.CHANNELS_STORED)
      this.broadcastCurrentChannels()
    })

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

  /**
   * Validates a log entry in the OrbitDB store.
   * @param entry The log entry to validate.
   * @returns True if valid, false otherwise.
   */
  public async validateEntry(entry: LogEntry<EncryptedAndSignedPayload>): Promise<boolean> {
    // TODO: unpin invalidated entries?
    try {
      if (entry.payload.op === 'PUT') {
        const encPayload = entry.payload.value!
        const decEntry = this.decryptChannelEntry(encPayload)
        if (!isChannel(decEntry)) {
          this.logger.error('Decrypted channel entry is not a valid channel:', entry.hash, decEntry)
          return false
        }
      }
      if (entry.payload.op === 'DEL') {
        if (!entry.payload.key) {
          this.logger.error('Delete channel entry is missing key:', entry.hash)
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
      if (
        !this.channelsRepos.has(channel.id) ||
        (!this.channelsRepos.get(channel.id)?.eventsAttached &&
          !this.channelsRepos.get(channel.id)?.store.isSubscribing)
      ) {
        await this.subscribeToChannel(channel)
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
    if (!this.channels) {
      throw new Error('Channels have not been initialized!')
    }
    const encryptedChannel = this.encryptChannelEntry(channel)
    await this.channels.put(channel.id, encryptedChannel)
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
    if (!this.channels) {
      throw new Error('Channels have not been initialized!')
    }
    const channelEncrypted = await this.channels.get(id)
    if (channelEncrypted == null) {
      return undefined
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

  /**
   * Read entries for all keys in the channels management database
   *
   * @returns All channel metadata in the channels management database
   * @throws Error
   */
  public async getChannels(): Promise<PublicChannel[]> {
    this.logger.debug('Getting channels')
    if (!this.channels) {
      throw new Error('Channels have not been initialized!')
    }
    return (await this.channels.all())
      .map(x => {
        try {
          this.logger.debug('Decrypting channel entry', x.key)
          return this.decryptChannelEntry(x.value, x.key)
        } catch (e) {
          if (e instanceof NotAMemberError || e.message.startsWith('Not a member of this channel')) {
            this.logger.warn(
              `Failed to decrypt and validate private channel entry during getChannels, ignoring...`,
              x.key
            )
          } else {
            this.logger.error('Failed to decrypt channel entry', e)
          }
          return undefined
        }
      })
      .filter((x): x is PublicChannel => x !== undefined)
  }

  /**
   * Maps metadata records for private channels to their LFA role name
   *
   * @returns Map of private channels to their role names
   * @throws Error
   */
  public async getPrivateChannelsByRolename(): Promise<Record<string, PublicChannel>> {
    if (!this.channels) {
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
    this.logger.info(`Creating channel`, channelData.id, channelData.name)

    const channelId = channelData.id
    const store = await this.createChannelStore(channelData)

    const channel = await this.getChannel(channelId)
    if (channel == undefined) {
      await this.setChannel(channelData)
    } else {
      this.logger.info(`Channel ${channelId} already exists`)
    }

    this.channelsRepos.set(channelId, { store, eventsAttached: false, public: true })
    this.logger.info(`Set ${channelId} to local channels`)
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
    const channelData: PublicChannel = {
      id: payload.id,
      name: payload.name,
      description: payload.description ?? '',
      owner: this.sigchainService.getActiveChain().user.userId,
      timestamp: DateTime.utc().valueOf(),
      public: payload.public ?? true,
      teamId: payload.teamId,
    }
    let roleName: string | undefined = undefined
    if (!(channelData.public ?? true)) {
      roleName = this.sigchainService.getActiveChain().channels.create(channelData.id)
      channelData.roleName = roleName
    }
    const store = await this.createChannel(channelData)
    if (!store) {
      throw new Error('Failed to create channel')
    }
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
    let store: ChannelStore
    // @ts-ignore
    if (channelData.address) {
      // @ts-ignore
      channelData.id = channelData.address
    }
    let repo = this.channelsRepos.get(channelData.id)

    if (repo) {
      store = repo.store
    } else {
      try {
        store = await this.createChannel(channelData)
      } catch (e) {
        this.logger.error(`Can't subscribe to channel ${channelData.id}`, e)
        return
      }
      if (!store) {
        this.logger.error(`Can't subscribe to channel ${channelData.id}, the DB isn't initialized!`)
        return
      }
      repo = this.channelsRepos.get(channelData.id)
    }

    if (repo && !repo.eventsAttached && !repo.store.isSubscribing) {
      this.handleMessageEventsOnChannelStore(channelData.id, repo)
      await repo.store.subscribe()
      repo.eventsAttached = true
    }

    this.logger.info(`Subscribed to channel ${channelData.id}`)
    this.emit(StorageEvents.CHANNEL_SUBSCRIBED, {
      channelId: channelData.id,
    } as ChannelSubscribedPayload)
    return { channel: channelData, status: ChannelOperationStatus.SUCCESS }
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
    const iAmAdmin = this.sigchainService.team.memberIsAdmin(this.sigchainService.getActiveChain().user.userId)
    const iOwnThisChannel = channel?.owner === this.sigchainService.getActiveChain().user.userId
    // NOTE: this doesn't prevent other users from deleting channels they don't own if they modify the client
    // TODO: invalidate removals from non-owners
    if (iAmAdmin || iOwnThisChannel) {
      await this.channels!.del(channelId)
    } else {
      this.logger.error(`User is not the owner of the channel ${channelId}`)
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

    if (channel.owner !== this.sigchainService.activeChain.user.userId) {
      this.logger.error(`You are not the owner of this channel, cannot add members to private channel!`)
      return { channelId, status: AddMembersChannelStatus.NOT_CHANNEL_OWNER }
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
    const repo = this.channelsRepos.get(message.channelId)
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
    try {
      this.logger.info('Closing channels DB')
      await this.channels?.close()
      this.logger.info('Closed channels DB')
    } catch (e) {
      this.logger.error('Error closing channels db', e)
    }

    this.logger.info(`Closing each channel's DB`)
    for (const [channelId, channel] of this.channelsRepos.entries()) {
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
    this.logger.info('Cleaning channels DB')
    try {
      await this.channels?.sync?.stop?.()
    } catch (e) {
      // If the sync is not started, this will throw an error
    }
    try {
      await this.channels?.drop?.()
    } catch (e) {
      this.logger.error('Error dropping channels DB', e)
    }
    for (const [channelId, channel] of this.channelsRepos.entries()) {
      try {
        this.logger.info(`Cleaning ${channelId} DB`)
        await channel.store.clean()
      } catch (e) {
        this.logger.error(`Error cleaning ${channelId} DB`, e)
      }
    }
    this.channels = undefined
    this.channelsRepos = new Map()
  }
}
