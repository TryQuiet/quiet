import { Injectable } from '@nestjs/common'

import { AccessController, EventsType, LogEntry } from '@orbitdb/core'

import { QuietLogger } from '@quiet/logger'
import {
  ChannelMessage,
  CompoundError,
  ConsumedChannelMessage,
  MessagesLoadedPayload,
  PublicChannel,
  PushNotificationPayload,
} from '@quiet/types'

import { createLogger } from '../../common/logger'
import { EventStoreBase } from '../base.store'
import { EventsWithStorage } from '../orbitDb/eventsWithStorage'
import { MessagesAccessController } from './messages/orbitdb/MessagesAccessController'
import { OrbitDbService } from '../orbitDb/orbitDb.service'
import validate from '../../validation/validators'
import { PublicChannelMessagesService } from './messages/public-channel-messages.service'
import { DBOptions, StorageEvents } from '../storage.types'
import { LocalDbService } from '../../local-db/local-db.service'
import { EncryptedMessage } from './messages/messages.types'
import { UserProfileStore } from '../userProfile/userProfile.store'
import { SigChainService } from '../../auth/sigchain.service'
import { PrivateMessagesAccessController } from './messages/orbitdb/PrivateMessagesAccessController'
import { PrivateChannelMessagesService } from './messages/private-channel-messages.service'
import { SigchainEvents } from '../../auth/types'

/**
 * Manages storage-level logic for a given channel in Quiet
 */
@Injectable()
export class ChannelStore extends EventStoreBase<EncryptedMessage, ConsumedChannelMessage> {
  private channelData: PublicChannel
  private _subscribing: boolean = false
  private _messagesService: PublicChannelMessagesService | PrivateChannelMessagesService | undefined = undefined
  private _accessController: typeof AccessController
  private authListenerAttached = false
  private readonly handleAuthUpdated = (): void => {
    void this.refreshMessageIds()
  }

  private logger: QuietLogger

  constructor(
    private readonly orbitDbService: OrbitDbService,
    private readonly localDbService: LocalDbService,
    private readonly _publicMessagesService: PublicChannelMessagesService,
    private readonly _privateMessagesService: PrivateChannelMessagesService,
    private readonly userProfileStore: UserProfileStore,
    private readonly auth: SigChainService,
    private readonly _publicMessagesAccessController: MessagesAccessController,
    private readonly _privateMessagesAccessController: PrivateMessagesAccessController
  ) {
    super()
  }

  public get messagesService(): PublicChannelMessagesService | PrivateChannelMessagesService {
    if (this._messagesService == null) {
      throw new Error(`Run store.init before accessing the messages service!`)
    }
    return this._messagesService
  }

  public get accessController(): typeof AccessController {
    if (this._accessController == null) {
      throw new Error(`Run store.init before accessing the OrbitDB access controller!`)
    }
    return this._accessController
  }

  // Initialization

  /**
   * Initialize this instance of ChannelStore by opening an OrbitDB database
   *
   * @param channelData Channel configuration metadata
   * @param options Database options for OrbitDB
   * @returns Initialized ChannelStore instance
   */
  public async init(channelData: PublicChannel, options: DBOptions): Promise<ChannelStore> {
    if (this.store != null) {
      this.logger.warn(`Channel ${this.channelData.name} has already been initialized!`)
      return this
    }

    this.channelData = channelData
    this.logger = createLogger(`storage:channels:channelStore:${this.channelData.name}`)
    this.logger.info(`Initializing channel store for channel ${this.channelData.name}`, channelData)

    if (channelData.public ?? true) {
      this._accessController = this._publicMessagesAccessController.createAccessControllerFunc({
        write: ['*'],
        sigchainService: this.auth,
      })
      this._messagesService = this._publicMessagesService
    } else {
      this._accessController = this._privateMessagesAccessController.createAccessControllerFunc({
        write: ['*'],
        sigchainService: this.auth,
        channelId: this.channelData.id,
        teamId: this.channelData.teamId ?? this.auth.team.id,
      })
      this._messagesService = this._privateMessagesService
    }

    this.store = await this.orbitDbService.open<EventsType<EncryptedMessage>>(`channels.${this.channelData.id}`, {
      type: 'events',
      Database: EventsWithStorage(),
      AccessController: this._accessController,
      sync: options.sync,
    })

    this.logger.info('Initialized')
    return this
  }

  /**
   * Start syncing the OrbitDB database
   */
  public async startSync(): Promise<void> {
    await this.store?.sync.start()
  }

  // Accessors

  public get isSubscribing(): boolean {
    return this._subscribing
  }

  /**
   * Subscribe to new messages on this channel
   *
   * @emits StorageEvents.MESSAGE_IDS_STORED
   * @emits StorageEvents.MESSAGES_STORED
   * @emits StorageEvents.SEND_PUSH_NOTIFICATION
   */
  public async subscribe(): Promise<void> {
    this.logger.info('Subscribing to channel ', this.channelData.id)
    this._subscribing = true

    this.getStore().events.on('update', async (entry: LogEntry<EncryptedMessage>) => {
      const entryChannelId = entry.payload.value?.channelId
      // TODO: seperate event bus for each channel so we don't have to check this on every update
      if (entryChannelId != null && entryChannelId !== this.channelData.id) {
        this.logger.debug(
          `Ignoring database update for different channel`,
          entry.hash,
          entryChannelId,
          this.channelData.id
        )
        return
      }

      this.logger.info(`${this.channelData.id} database updated`, entry.hash, entryChannelId)
      let message: ChannelMessage | undefined | false = undefined
      if (entry.payload.value == null) {
        this.logger.error(`Message entry was nullish!`, entry.hash, this.channelData.id)
      } else {
        message = await this.messagesService.onConsume(entry.payload.value!)
        if (message == null) {
          this.logger.error(`Message could not be consumed!`, entry.payload.value.id, entry.payload.value.channelId)
        } else if (message == false) {
          this.logger.trace(`Skipping processing message`, entry.payload.value.id, entry.payload.value.channelId)
        } else {
          await this._handleMessageOnUpdate(message)
        }
      }
      await this.refreshMessageIds()
    })

    if (!this.authListenerAttached) {
      this.auth.on(SigchainEvents.UPDATED, this.handleAuthUpdated)
      this.authListenerAttached = true
    }

    try {
      await this.startSync()
    } catch (e) {
      if ((e as Error).name === 'DuplicateProtocolHandlerError') {
        this.logger.warn(`We have already subscribed to this channel`)
        this._subscribing = false
        return
      }
    }
    await this.refreshMessageIds()
    this._subscribing = false

    this.logger.info(`Subscribed to channel ${this.channelData.id}`)
  }

  private async _handleMessageOnUpdate(message: ConsumedChannelMessage): Promise<void> {
    this.emit(StorageEvents.MESSAGES_STORED, {
      messages: [message],
      isVerified: message.verified,
    })

    // FIXME: the 'update' event runs if we replicate entries and if we add
    // entries ourselves. So we may want to check if the message is written
    // by us.
    //
    // Display push notifications on mobile
    if (process.env.BACKEND === 'mobile') {
      if (!message.verified) return

      // Do not notify about old messages
      if (message.createdAt < parseInt(process.env.CONNECTION_TIME || '')) return

      const username = (await this.userProfileStore.getUsername(message.userId)) || message.userId
      const payload: PushNotificationPayload = {
        message: JSON.stringify(message),
        username: username,
      }

      this.logger.info(`Sending push notification`, JSON.stringify(payload))

      this.emit(StorageEvents.SEND_PUSH_NOTIFICATION, payload)
    }
  }

  // Messages

  /**
   * Validate and append a new message to this channel's OrbitDB database
   *
   * @param message Message to add to the OrbitDB database
   */
  public async sendMessage(message: ChannelMessage): Promise<boolean> {
    this.logger.info(`Sending message with ID ${message.id} on channel ${this.channelData.id}`)
    if (!validate.isMessage(message)) {
      this.logger.error('Public channel message is invalid')
      return false
    }

    if (message.channelId != this.channelData.id) {
      this.logger.error(
        `Could not send message. Message is for channel ID ${message.channelId} which does not match channel ID ${this.channelData.id}`
      )
      return false
    }

    try {
      await this.addEntry(message)
      return true
    } catch (e) {
      this.logger.error(`Error while sending message`, e)
    }

    return false
  }

  /**
   * Read messages from OrbitDB, optionally filtered by message ID
   *
   * @param ids Message IDs to read from this channel's OrbitDB database
   * @returns Messages read from OrbitDB
   */
  public async getMessages(ids: string[] | undefined = undefined): Promise<MessagesLoadedPayload | undefined> {
    const messages = await this.getEntries(ids)
    return {
      messages,
      isVerified: true,
    }
  }

  /**
   * Get the latest state of messages in OrbitDB and emit an event to trigger redux updates
   *
   * @emits StorageEvents.MESSAGE_IDS_STORED
   */
  private async refreshMessageIds(): Promise<void> {
    try {
      const ids = (await this.getEntries()).map(msg => msg.id)
      const community = await this.localDbService.getCurrentCommunity()

      if (community) {
        this.emit(StorageEvents.MESSAGE_IDS_STORED, {
          ids,
          channelId: this.channelData.id,
          communityId: community.id,
        })
      }
    } catch (e) {
      if (e.message.includes('Store not initialized')) {
        this.logger.warn(`Attempted to refresh message IDs for store that isn't open`)
      } else {
        throw e
      }
    }
  }

  // Base Store Logic

  /**
   * Add a new event to the OrbitDB event store
   *
   * @param message Message to add to the OrbitDB database
   * @returns Hash of the new database entry
   */
  public async addEntry(message: ChannelMessage): Promise<string> {
    this.logger.info('Adding message to database')
    try {
      const encryptedMessage = await this.messagesService.onSend(message)
      return await this.getStore().add(encryptedMessage)
    } catch (e) {
      throw new CompoundError(`Could not append message (entry not allowed to write to the log)`, e)
    }
  }

  /**
   * Read a list of entries on the OrbitDB event store and decrypt
   *
   * @param ids Optional list of message IDs to filter by
   * @returns All matching entries on the event store
   */
  public async getEntries(): Promise<ConsumedChannelMessage[]>
  public async getEntries(ids: string[] | undefined): Promise<ConsumedChannelMessage[]>
  public async getEntries(ids?: string[] | undefined): Promise<ConsumedChannelMessage[]> {
    this.logger.info(`Getting all messages for channel`, this.channelData.id, this.channelData.name)
    const messages: ConsumedChannelMessage[] = []

    for await (const x of this.getStore().iterator()) {
      if (x.value == null) {
        this.logger.warn(`Orbitdb record was null`, x.hash)
        continue
      }

      if (ids == null || ids?.includes(x.value.id)) {
        const decryptedMessage = await this.messagesService.onConsume(x.value)
        if (decryptedMessage == null || decryptedMessage === false) {
          continue
        }
        messages.push(decryptedMessage)
      }
    }
    this.logger.info(`Got ${messages.length} messages for channel`, this.channelData.id, this.channelData.name)
    return messages
  }

  /**
   * Read a list of entries on the OrbitDB event store without decrypting
   *
   * @param ids Optional list of message IDs to filter by
   * @returns All matching entries on the event store
   */
  public async getEncryptedEntries(): Promise<EncryptedMessage[]>
  public async getEncryptedEntries(ids: string[] | undefined): Promise<EncryptedMessage[]>
  public async getEncryptedEntries(ids?: string[] | undefined): Promise<EncryptedMessage[]> {
    this.logger.info(`Getting all encrypted messages for channel`, this.channelData.id, this.channelData.name)
    const messages: EncryptedMessage[] = []

    for await (const x of this.getStore().iterator()) {
      if (ids == null || ids?.includes(x.value.id)) {
        messages.push(x.value)
      }
    }

    return messages
  }

  // Close Logic

  /**
   * Stop syncing the OrbitDB database
   */
  public async stopSync(): Promise<void> {
    await this.store?.sync.stop()
  }

  /**
   * Close the OrbitDB database
   */
  public async close(): Promise<void> {
    this.logger.info(`Closing channel store`)
    await this.stopSync()
    await this.getStore().close()
  }

  /**
   * Delete the channel from OrbitDB
   */
  public async deleteChannel(): Promise<void> {
    this.logger.info(`Deleting channel`)
    await this.clean()
  }

  /**
   * Clean this ChannelStore
   *
   * NOTE: Does NOT affect data stored in IPFS
   */
  public async clean(): Promise<void> {
    this.logger.info(`Cleaning channel store`, this.channelData.id, this.channelData.name)
    try {
      await this.stopSync()
    } catch (e) {
      // If we are not subscribed, this will throw an error
    }
    try {
      if (!this.store) {
        this.logger.warn(`Store is already undefined, nothing to drop`)
      } else {
        await this.getStore().drop()
      }
    } catch (e) {
      this.logger.error(`Failed to drop store`, e)
    }
    if (this.authListenerAttached) {
      this.auth.removeListener(SigchainEvents.UPDATED, this.handleAuthUpdated)
      this.authListenerAttached = false
    }
    this.store = undefined
    this._subscribing = false
  }
}
