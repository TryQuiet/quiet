import { Injectable } from '@nestjs/common'
import { EventEmitter } from 'events'

import {
  AccessController,
  EventsType,
  LogEntry,
  useAccessController as orbitDbUseAccessController,
} from '@orbitdb/core'

import { QuietLogger } from '@quiet/logger'
import {
  ChannelMessage,
  ChannelType,
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
import { DirectMessagesService } from './messages/direct-messages.service'

type IndexedEntry = { id: string; userId: string }
// trusted: the head came from this log's own heads(), so its bytes may be read even before the
// log index lists it. notify: true while its MESSAGES_STORED / push announcement is still owed,
// false while that announcement is being published and not yet acknowledged. delivered: the
// listeners of each announcement event that already received this message, so a retry after a
// failing listener reaches only the listeners still owed it.
type Listener = (...args: any[]) => void
// Per announcement target and event, how many registrations of each listener already received
// the message.
type Delivered = Map<string, Map<Listener, number>>
type PendingHead = { notify: boolean; trusted: boolean; delivered?: Delivered }
type AuthFingerprint = { localUserId: string; members: Map<string, string> }
// notify: arrivals this walk consumed whose announcement is still owed, keyed by their entry hash so
// the announcement can be acknowledged (or handed back to the pending set) after it is published.
// revision: the authorization revision the message was consumed under; it may only be announced
// while that revision is still current.
type Notification = { hash: string; message: ConsumedChannelMessage; revision: number }
// revision: the authorization revision the walk started under; its ids may only be announced as a
// delta while that revision is current, otherwise the next reconciliation snapshot carries them.
type WalkResult = { ids: string[]; notify: Notification[]; complete: boolean; revision: number }

/**
 * Members whose consume results a sigchain update may have changed, or undefined when the whole
 * index must be rebuilt: no usable context on either side, or the local user's own facts changed.
 */
export const affectedMembers = (
  previous: AuthFingerprint | undefined,
  next: AuthFingerprint | undefined
): Set<string> | undefined => {
  if (previous === undefined || next === undefined) return undefined
  if (previous.localUserId !== next.localUserId) return undefined
  if (previous.members.get(next.localUserId) !== next.members.get(next.localUserId)) return undefined
  const affected = new Set<string>()
  for (const userId of new Set([...previous.members.keys(), ...next.members.keys()])) {
    if (previous.members.get(userId) !== next.members.get(userId)) affected.add(userId)
  }
  return affected
}

/**
 * Manages storage-level logic for a given channel in Quiet
 */
@Injectable()
export class ChannelStore extends EventStoreBase<EncryptedMessage, ConsumedChannelMessage> {
  private channelData: PublicChannel
  private _subscribing: boolean = false
  private _messagesService:
    PublicChannelMessagesService | PrivateChannelMessagesService | DirectMessagesService | undefined = undefined
  private _accessController: typeof AccessController
  private authListenerAttached = false
  // Index only successfully consumed entries. Message IDs alone are untrusted until onConsume
  // has checked their ciphertext, signature, channel and current authorization context.
  private readonly indexedEntries = new Map<string, IndexedEntry>()
  private readonly messageHashes = new Map<string, Set<string>>()
  // Entries of this channel that onConsume rejected under the current authorization context.
  // They are rechecked on every sigchain update instead of rewalking the whole log.
  private readonly rejectedHashes = new Set<string>()

  private indexMessage(hash: string, message: ConsumedChannelMessage): void {
    this.rejectedHashes.delete(hash)
    this.indexedEntries.set(hash, { id: message.id, userId: message.userId })
    const hashes = this.messageHashes.get(message.id) ?? new Set<string>()
    hashes.add(hash)
    this.messageHashes.set(message.id, hashes)
  }

  private unindexMessage(hash: string): void {
    const entry = this.indexedEntries.get(hash)
    if (entry === undefined) return
    this.indexedEntries.delete(hash)
    const hashes = this.messageHashes.get(entry.id)
    hashes?.delete(hash)
    if (hashes?.size === 0) this.messageHashes.delete(entry.id)
  }

  private messageIndexReady = false
  private closing = false
  private messageIndexEpoch = 0
  private messageIndexRefresh: Promise<void> | undefined
  // A completed hash includes all of its next ancestry, even entries rejected by onConsume.
  // Completion is valid only in this auth epoch. Serialize walks so concurrent heads share work.
  private readonly indexedAncestry = new Set<string>()
  private messageIndexWork: Promise<unknown> = Promise.resolve()
  // Heads announced by OrbitDB whose ancestry walk or MESSAGES_STORED notification has not
  // completed yet: a walk was cut short by an auth epoch change, or an ancestor was not readable.
  private readonly pendingHeads = new Map<string, PendingHead>()
  private retryTimer: NodeJS.Timeout | undefined
  private retryDelayMs = ChannelStore.RETRY_DELAY_MS
  private static readonly RETRY_DELAY_MS = 1_000
  private static readonly MAX_RETRY_DELAY_MS = 30_000
  // Authorization facts the consumers depend on. committedAuth: every indexed entry not authored by
  // a dirty member was checked under these facts. latestAuth: the facts the dirty set was diffed up
  // to. authRevision counts every accepted sigchain update; a consume is current only while the
  // revision it started under is still the latest, and a member stays dirty until a recheck that
  // started at or after the revision that dirtied them commits.
  private committedAuth: AuthFingerprint | undefined
  private latestAuth: AuthFingerprint | undefined
  private authRevision = 0
  private readonly dirtyAuthors = new Map<string, number>()
  private authRecheckNeeded = false
  private authRecheckQueued = false
  private idsResendNeeded = false
  // Emitters whose listeners receive this store's announcements exactly as this store's own do.
  private readonly announcementTargets: EventEmitter[] = [this]
  private storeEvents: EventEmitter | undefined
  private storeUpdateListener: ((entry: LogEntry<EncryptedMessage>) => Promise<void>) | undefined

  private queueMessageIndex<T>(work: () => Promise<T>): Promise<T> {
    const task = this.messageIndexWork.then(work)
    this.messageIndexWork = task.catch(() => {})
    return task
  }

  private invalidateMessageIndex(): void {
    this.messageIndexEpoch += 1
    this.messageIndexReady = false
    this.indexedEntries.clear()
    this.messageHashes.clear()
    this.rejectedHashes.clear()
    this.indexedAncestry.clear()
    this.committedAuth = undefined
    this.latestAuth = undefined
    this.dirtyAuthors.clear()
    this.authRecheckNeeded = false
    this.messageIndexWork = Promise.resolve()
  }

  private clearRetry(): void {
    if (this.retryTimer !== undefined) clearTimeout(this.retryTimer)
    this.retryTimer = undefined
    this.retryDelayMs = ChannelStore.RETRY_DELAY_MS
  }

  /** Retry pending heads later with exponential backoff. Cheap: only pending heads are walked. */
  private scheduleRetry(): void {
    if (this.closing || this.retryTimer !== undefined) return
    const delay = this.retryDelayMs
    this.retryDelayMs = Math.min(this.retryDelayMs * 2, ChannelStore.MAX_RETRY_DELAY_MS)
    this.retryTimer = setTimeout(() => {
      this.retryTimer = undefined
      void this.retryPending()
    }, delay)
    this.retryTimer.unref?.()
  }

  private async retryPending(): Promise<void> {
    if (this.closing) return
    try {
      if (!this.messageIndexReady) {
        await this.refreshMessageIds()
        return
      }
      if (this.authRecheckNeeded) {
        await this.recheckAuthorization()
        return
      }
      if (this.idsResendNeeded) {
        // A MESSAGE_IDS_STORED consumer failed: the snapshot repeats for everyone, IDs are candidates.
        this.idsResendNeeded = false
        await this.refreshMessageIds()
      }
      const epoch = this.messageIndexEpoch
      const result = await this.queueMessageIndex(() => this.walkPendingHeads(epoch))
      await this.publishWalk(result, epoch)
    } catch (error) {
      this.logger.error('Retrying pending channel heads failed', error)
      this.scheduleRetry()
    }
  }

  /**
   * The facts onConsume depends on: the local user's own membership and roles, and every
   * member's keys and roles. A sigchain update that changes none of them cannot change a
   * consume result, and one that changes other members' facts affects only their messages.
   */
  private computeAuthFingerprint(): AuthFingerprint | undefined {
    try {
      const chain = this.auth.getActiveChain(false)
      const team = chain?.team
      const localUserId = chain?.user?.userId
      if (chain == null || team == null || typeof team.members !== 'function' || !localUserId) return undefined
      const members = new Map<string, string>()
      for (const member of team.members()) {
        members.set(
          member.userId,
          JSON.stringify([
            member.keys?.generation,
            member.keys?.encryption,
            member.keys?.signature,
            [...(member.roles ?? [])].sort(),
          ])
        )
      }
      return { localUserId, members }
    } catch (error) {
      this.logger.warn('Could not capture the authorization context of the message index', error)
      return undefined
    }
  }

  private readonly handleAuthUpdated = (teamId?: string): void => {
    if (this.closing) return
    const ownTeamId = this.channelData?.teamId
    if (teamId !== undefined && ownTeamId !== undefined && teamId !== ownTeamId) return
    const next = this.computeAuthFingerprint()
    const affected = affectedMembers(this.committedAuth, next)
    if (affected === undefined) {
      // Unknown context or a change to this user's own authorization: previously unreadable
      // entries may now have keys, and previously readable entries may no longer be authorized.
      // Never reuse successful or failed consumes across such an update.
      this.invalidateMessageIndex()
      this.refreshMessageIds().catch(error => this.logger.error('Rebuilding the message index failed', error))
      return
    }
    // Every other update leaves already checked consumes valid, except for members whose keys or
    // roles changed. Accumulate them (updates can overlap) and recheck only their entries plus
    // entries rejected so far, after any walk already queued. In-flight walks stay valid: an
    // entry they index under the previous facts is rechecked by the same queued task.
    this.authRevision += 1
    for (const userId of affected) {
      // A member already dirty under these same facts is covered by the recheck queued for them.
      if (this.dirtyAuthors.has(userId) && this.latestAuth?.members.get(userId) === next!.members.get(userId)) continue
      this.dirtyAuthors.set(userId, this.authRevision)
    }
    this.latestAuth = next
    this.authRecheckNeeded = true
    if (this.authRecheckQueued) return
    this.authRecheckQueued = true
    this.recheckAuthorization().catch(error => this.logger.error('Rechecking message authorization failed', error))
  }

  private async recheckAuthorization(): Promise<void> {
    const epoch = this.messageIndexEpoch
    try {
      const result = await this.queueMessageIndex(async (): Promise<WalkResult | undefined> => {
        this.authRecheckQueued = false
        if (epoch !== this.messageIndexEpoch || this.closing || !this.authRecheckNeeded) return undefined
        const authors = new Map(this.dirtyAuthors)
        const target = this.latestAuth
        const ids: string[] = []
        const notify: Notification[] = []
        const log = this.getStore().log
        const recheck = new Set<string>(this.rejectedHashes)
        for (const [hash, entry] of this.indexedEntries) if (authors.has(entry.userId)) recheck.add(hash)
        for (const hash of recheck) {
          const entry = (await log.get(hash)) as LogEntry<EncryptedMessage> | undefined
          if (epoch !== this.messageIndexEpoch || this.closing) return undefined
          const value = entry?.payload.value
          if (value?.channelId !== this.channelData.id) continue
          const revision = this.authRevision
          const message = await this.messagesService.onConsume(value, this.channelData)
          if (epoch !== this.messageIndexEpoch || this.closing) return undefined
          // An announcement owed for a completed entry is decided by this consume: announce the
          // current result, or drop it now that the entry is rejected.
          const pending = this.pendingHeads.get(hash)
          const owed = pending?.notify === true && this.indexedAncestry.has(hash)
          if (message != null && message !== false) {
            if (!this.indexedEntries.has(hash)) ids.push(message.id)
            this.indexMessage(hash, message)
            if (owed) {
              notify.push({ hash, message, revision })
              this.pendingHeads.set(hash, { ...pending!, notify: false })
            }
          } else {
            this.unindexMessage(hash)
            this.rejectedHashes.add(hash)
            if (owed) this.pendingHeads.delete(hash)
          }
        }
        // Commit: a member rechecked under the target facts is clean unless a later update dirtied
        // them again meanwhile; they and any other members dirtied since stay for the next recheck.
        for (const [userId, revision] of authors) {
          if (this.dirtyAuthors.get(userId) === revision) this.dirtyAuthors.delete(userId)
        }
        this.committedAuth = target
        if (this.dirtyAuthors.size === 0) this.authRecheckNeeded = false
        const pending = await this.walkPendingHeads(epoch)
        return { ...pending, ids: [...ids, ...pending.ids], notify: [...notify, ...pending.notify] }
      })
      if (result === undefined || epoch !== this.messageIndexEpoch || this.closing) return
      const published = await this.publishNotifications(result.notify, epoch)
      if (result.complete && published && !this.authRecheckNeeded) this.retryDelayMs = ChannelStore.RETRY_DELAY_MS
      else this.scheduleRetry()
      // Removed IDs need the reconciliation snapshot, not a delta.
      await this.refreshMessageIds()
    } catch (error) {
      if (epoch !== this.messageIndexEpoch || this.closing) return
      // The dirty members and the rejected set are untouched: the retry repeats this recheck.
      this.logger.error('Rechecking message authorization failed, retrying later', error)
      this.scheduleRetry()
    }
  }

  private async walkPendingHeads(epoch: number): Promise<WalkResult> {
    const ids: string[] = []
    const notify: WalkResult['notify'] = []
    const revision = this.authRevision
    let complete = true
    for (const [hash, pending] of [...this.pendingHeads]) {
      const result = await this.walkAncestry(hash, epoch, pending.trusted)
      if (epoch !== this.messageIndexEpoch || this.closing) return { ids, notify, complete: false, revision }
      ids.push(...result.ids)
      notify.push(...result.notify)
      if (!result.complete) complete = false
    }
    return { ids, notify, complete, revision }
  }

  /** Emit the delta announcement and per-message notifications outside the index queue. */
  private async publishWalk(result: WalkResult, epoch: number): Promise<void> {
    if (epoch !== this.messageIndexEpoch || this.closing) {
      this.returnNotifications(result.notify)
      return
    }
    const published = await this.publishNotifications(result.notify, epoch)
    if (result.complete && published) this.retryDelayMs = ChannelStore.RETRY_DELAY_MS
    else this.scheduleRetry()
    await this.refreshMessageIds(result.ids, epoch, result.revision)
  }

  /**
   * Announce arrivals in order. Each announcement is acknowledged only once every listener
   * received it under the epoch and authorization revision it was consumed in; anything not fully
   * delivered goes back to the pending set, so an auth change or a failing listener in this window
   * delays the announcement (for the listeners still owed it) instead of losing or repeating it.
   * Returns false when the caller must schedule a retry for the returned announcements.
   */
  private async publishNotifications(owed: WalkResult['notify'], epoch: number): Promise<boolean> {
    for (let n = 0; n < owed.length; n++) {
      const { hash, message, revision } = owed[n]
      let delivered = false
      try {
        delivered =
          this.isCurrent(epoch, revision) &&
          (await this._handleMessageOnUpdate(message, epoch, revision, this.deliveryRecord(hash)))
      } catch (error) {
        this.logger.error('Announcing a channel message failed, retrying later', hash, error)
      }
      if (!delivered) {
        this.returnNotifications(owed.slice(n))
        return false
      }
      this.acknowledgeNotification(hash)
    }
    return true
  }

  private isCurrent(epoch: number, revision: number): boolean {
    return epoch === this.messageIndexEpoch && revision === this.authRevision && !this.closing
  }

  private deliveryRecord(hash: string): Delivered {
    const pending = this.pendingHeads.get(hash)
    if (pending === undefined) return new Map()
    pending.delivered ??= new Map()
    return pending.delivered
  }

  /**
   * Announce to the listeners of another emitter as if they were registered on this store: each
   * registration is delivered to individually, so one failing consumer neither hides an
   * announcement from the others nor makes a retry repeat it to them.
   */
  public forwardAnnouncementsTo(target: EventEmitter): void {
    if (!this.announcementTargets.includes(target)) this.announcementTargets.push(target)
  }

  /**
   * Hand one announcement to each registered listener not yet given it. EventEmitter.emit stops at
   * the first throwing listener; delivering registration by registration lets the others receive
   * the message now and a retry reach only the ones that threw. A listener that throws before its
   * effect therefore sees the message exactly once; one that throws after its effect sees it again
   * (at least once), which is why the state-manager upserts messages by ID.
   */
  private deliver(event: StorageEvents, payload: unknown, delivered: Delivered): boolean {
    let complete = true
    for (const [n, target] of this.announcementTargets.entries()) {
      const key = `${n}:${event}`
      const done = delivered.get(key) ?? new Map<Listener, number>()
      delivered.set(key, done)
      // rawListeners keeps once() wrappers (calling one unregisters it) and repeated registrations.
      const seen = new Map<Listener, number>()
      const failed = new Set<Listener>()
      for (const listener of target.rawListeners(event) as Listener[]) {
        const occurrence = seen.get(listener) ?? 0
        seen.set(listener, occurrence + 1)
        if (occurrence < (done.get(listener) ?? 0) || failed.has(listener)) continue
        try {
          listener.call(target, payload)
          done.set(listener, occurrence + 1)
        } catch (error) {
          this.logger.error(`A ${event} listener failed, retrying later`, error)
          failed.add(listener)
          complete = false
        }
      }
    }
    return complete
  }

  private acknowledgeNotification(hash: string): void {
    const pending = this.pendingHeads.get(hash)
    if (pending === undefined || pending.notify) return
    if (this.indexedAncestry.has(hash)) this.pendingHeads.delete(hash)
  }

  private returnNotifications(owed: WalkResult['notify']): void {
    if (this.closing) return
    for (const { hash } of owed) {
      const pending = this.pendingHeads.get(hash)
      this.pendingHeads.set(hash, { ...pending, notify: true, trusted: pending?.trusted ?? false })
    }
  }

  private readonly deliveredDmIds = new Set<string>()
  private logger: QuietLogger

  constructor(
    private readonly orbitDbService: OrbitDbService,
    private readonly localDbService: LocalDbService,
    private readonly _publicMessagesService: PublicChannelMessagesService,
    private readonly _privateMessagesService: PrivateChannelMessagesService,
    private readonly _directMessagesService: DirectMessagesService,
    private readonly userProfileStore: UserProfileStore,
    private readonly auth: SigChainService,
    private readonly _publicMessagesAccessController: MessagesAccessController,
    private readonly _privateMessagesAccessController: PrivateMessagesAccessController
  ) {
    super()
  }

  public get messagesService(): PublicChannelMessagesService | PrivateChannelMessagesService | DirectMessagesService {
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

    // The team a message is authorized against comes from the local sigchain, never from
    // `channelData`. Channel metadata is replicated, so a peer controls `channelData.teamId` for
    // every channel this node learns about rather than creates. Anchoring the access controller to
    // it would let an attacker publish channel metadata naming a team of their choosing and then
    // send messages stamped with that same team: the `encryptedMessage.teamId !== config.teamId`
    // check would compare two values they supplied and pass. This node only ever serves one chain,
    // and `createChannelStore` already rewrites the stored metadata to this same id.
    if (channelData.type === ChannelType.DM) {
      const trusted = this.auth.getActiveChain().directMessages.channel(channelData.id)
      this.channelData = trusted
      const accessController = this._privateMessagesAccessController.createAccessControllerFunc({
        write: [...trusted.memberIds!],
        sigchainService: this.auth,
        channelId: trusted.id,
        teamId: this.auth.team.id,
        roleName: '',
        directMessage: true,
      })
      orbitDbUseAccessController(accessController as any)
      this._accessController = accessController
      this._messagesService = this._directMessagesService
    } else if (channelData.public ?? true) {
      this._accessController = this._publicMessagesAccessController.createAccessControllerFunc({
        write: ['*'],
        sigchainService: this.auth,
        channelId: this.channelData.id,
        teamId: this.auth.team.id,
      })
      this._messagesService = this._publicMessagesService
    } else {
      if (this.channelData.roleName == null) {
        throw new Error('Invalid role name for private channel!')
      }
      const accessController = this._privateMessagesAccessController.createAccessControllerFunc({
        write: ['*'],
        sigchainService: this.auth,
        channelId: this.channelData.id,
        teamId: this.auth.team.id,
        roleName: this.channelData.roleName,
      })
      orbitDbUseAccessController(accessController as any)
      this._accessController = accessController
      this._messagesService = this._privateMessagesService
    }

    this.store = await this.orbitDbService.open<EventsType<EncryptedMessage>>(`channels.${this.channelData.id}`, {
      type: 'events',
      Database: EventsWithStorage(),
      AccessController: this._accessController,
      sync: options.sync,
    })

    this.closing = false
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

    if (this.channelData.type === ChannelType.DM) {
      for (const message of await this.getEntries()) this.deliveredDmIds.add(message.id)
    }

    this.detachStoreListener()
    const events = this.getStore().events
    // The events bus is shared by every database this process opens; detach it on close.
    this.storeEvents = events
    this.storeUpdateListener = (entry: LogEntry<EncryptedMessage>) => this.handleStoreUpdate(entry)
    events.on('update', this.storeUpdateListener)

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

  /**
   * OrbitDB emits update for the joined head, although joinEntry may also import its entire
   * missing next ancestry. Walk that delta and announce it. This listener runs un-awaited on a
   * shared bus, so it must never reject: a walk that cannot complete is retried later.
   */
  private async handleStoreUpdate(entry: LogEntry<EncryptedMessage>): Promise<void> {
    if (this.closing) return
    const entryChannelId = entry.payload.value?.channelId
    // TODO: seperate event bus for each channel so we don't have to check this on every update
    if (entryChannelId !== this.channelData.id) {
      this.logger.debug(
        `Ignoring database update without matching channel`,
        entry.hash,
        entryChannelId,
        this.channelData.id
      )
      return
    }

    this.logger.info(`${this.channelData.id} database updated`, entry.hash, entryChannelId)
    // A head whose ancestry is complete and whose arrival was announced needs no second walk;
    // the shared bus replays it when another local database joins the same entry.
    if (this.indexedAncestry.has(entry.hash) && !this.pendingHeads.has(entry.hash)) return
    // Register before queueing: a walk already running for a newer head may index this entry
    // first, and then it announces the arrival instead of this walk.
    const pending = this.pendingHeads.get(entry.hash)
    this.pendingHeads.set(entry.hash, {
      ...pending,
      notify: pending?.notify ?? true,
      trusted: pending?.trusted ?? false,
    })
    const epoch = this.messageIndexEpoch
    try {
      const result = await this.queueMessageIndex(async (): Promise<WalkResult | undefined> => {
        if (epoch !== this.messageIndexEpoch || this.closing) return undefined
        return this.walkAncestry(entry.hash, epoch, false)
      })
      if (result === undefined) return
      await this.publishWalk(result, epoch)
    } catch (error) {
      if (epoch !== this.messageIndexEpoch || this.closing) return
      this.logger.error(`Indexing channel update failed, retrying later`, entry.hash, error)
      this.scheduleRetry()
    }
  }

  private detachStoreListener(): void {
    if (this.storeEvents !== undefined && this.storeUpdateListener !== undefined) {
      this.storeEvents.off('update', this.storeUpdateListener)
    }
    this.storeEvents = undefined
    this.storeUpdateListener = undefined
  }

  /**
   * Announce one consumed arrival: MESSAGES_STORED, and on mobile a push notification. Returns
   * false when the announcement could not be completed under the epoch and authorization revision
   * the message was consumed in, or when a listener failed; the caller then keeps it pending and
   * a retry reaches only the listeners still owed it. Nothing is recorded before that decision.
   */
  private async _handleMessageOnUpdate(
    message: ConsumedChannelMessage,
    epoch: number,
    revision: number,
    delivered: Delivered
  ): Promise<boolean> {
    let notification: PushNotificationPayload | undefined
    // Display push notifications on mobile
    if (process.env.BACKEND === 'mobile' && message.verified) {
      // OrbitDB emits updates for local writes as well as replicated messages.
      // Use the authenticated identity, including when a pending send finishes in
      // the background. Tor-only communities need no cached QSS credentials here.
      const localUserId = this.auth.getActiveChain(false)?.user.userId
      // Do not notify about own or old messages
      if (
        localUserId &&
        message.userId !== localUserId &&
        message.createdAt >= parseInt(process.env.CONNECTION_TIME || '')
      ) {
        const username = (await this.userProfileStore.getUsername(message.userId)) || message.userId
        notification = { message: JSON.stringify(message), username }
      }
    }
    // The lookup may outlive authorization changes or the store itself.
    if (!this.isCurrent(epoch, revision)) return false
    // A DM ID counts as delivered only once every listener received it.
    if (this.channelData.type === ChannelType.DM && this.deliveredDmIds.has(message.id)) return true
    let complete = this.deliver(
      StorageEvents.MESSAGES_STORED,
      {
        messages: [message],
        isVerified: message.verified,
      },
      delivered
    )
    if (notification !== undefined) {
      this.logger.info(`Sending authenticated message notification`)
      complete = this.deliver(StorageEvents.SEND_PUSH_NOTIFICATION, notification, delivered) && complete
    }
    if (complete && this.channelData.type === ChannelType.DM) this.deliveredDmIds.add(message.id)
    return complete
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
      isVerified: messages.every(message => message.verified === true),
    }
  }

  /**
   * Get the latest state of messages in OrbitDB and emit an event to trigger redux updates
   *
   * @emits StorageEvents.MESSAGE_IDS_STORED
   */
  private async refreshMessageIds(
    addedIds?: string[],
    addedEpoch = this.messageIndexEpoch,
    addedRevision = this.authRevision
  ): Promise<void> {
    try {
      const wasReady = this.messageIndexReady
      await this.ensureMessageIndex()
      if (this.closing) return
      const epoch = this.messageIndexEpoch
      const community = await this.localDbService.getCurrentCommunity()
      if (epoch !== this.messageIndexEpoch || this.closing) return
      // The frontend treats IDs as candidates to fetch, not an authoritative replacement list.
      // Ordinary arrivals need only announce the delta; reconciliation still sends a snapshot.
      // Both are announced only under current facts, decided after the last await: a delta
      // consumed under superseded facts and the entries of members whose recheck is still owed
      // wait for the recheck's own snapshot.
      const current = addedEpoch === epoch && addedRevision === this.authRevision
      const ids = wasReady && addedIds !== undefined && current ? addedIds : this.announcedIds()
      if (addedIds !== undefined && ids.length === 0) return

      if (community) {
        const payload = { ids, channelId: this.channelData.id, communityId: community.id }
        if (!this.deliver(StorageEvents.MESSAGE_IDS_STORED, payload, new Map())) {
          this.idsResendNeeded = true
          this.scheduleRetry()
        }
      }
    } catch (e) {
      const error = e instanceof Error ? e : new Error(String(e))
      if (error.message.includes('Store not initialized')) {
        this.logger.warn(`Attempted to refresh message IDs for store that isn't open`)
      } else if (!this.closing) {
        // Subscription must survive an unreadable log; the rebuild is retried in the background.
        this.logger.error(`Refreshing message IDs failed, retrying later`, error)
        this.scheduleRetry()
      }
    }
  }

  /** Every indexed ID whose author is not awaiting a recheck. */
  private announcedIds(): string[] {
    const ids = new Set<string>()
    for (const entry of this.indexedEntries.values()) {
      if (!this.dirtyAuthors.has(entry.userId)) ids.add(entry.id)
    }
    return [...ids]
  }

  /** Coalesce initial sync and auth-triggered rebuilds; ordinary arrivals update the index above. */
  private async ensureMessageIndex(): Promise<void> {
    if (this.messageIndexReady || this.closing) return
    if (this.messageIndexRefresh != null) {
      await this.messageIndexRefresh
      // An auth event can invalidate the index after the builder's final await has settled.
      if (!this.messageIndexReady) await this.ensureMessageIndex()
      return
    }

    this.messageIndexRefresh = (async () => {
      while (!this.messageIndexReady && !this.closing) {
        const epoch = this.messageIndexEpoch
        let result: WalkResult | undefined
        try {
          result = await this.queueMessageIndex(async (): Promise<WalkResult | undefined> => {
            if (epoch !== this.messageIndexEpoch || this.closing) return undefined
            // Everything is re-walked under the facts captured here; nothing is dirty yet.
            this.committedAuth = this.computeAuthFingerprint()
            this.latestAuth = this.committedAuth
            this.dirtyAuthors.clear()
            this.authRecheckNeeded = false
            const heads: LogEntry<EncryptedMessage>[] = await this.getStore().log.heads()
            if (epoch !== this.messageIndexEpoch || this.closing) return undefined
            for (const head of heads) {
              const pending = this.pendingHeads.get(head.hash)
              this.pendingHeads.set(head.hash, { ...pending, notify: pending?.notify ?? false, trusted: true })
            }
            return this.walkPendingHeads(epoch)
          })
        } catch (error) {
          // A closed/replaced store may reject pending reads. Discard only stale work, then
          // rebuild the current store; an error in the current epoch is retried later.
          if (epoch === this.messageIndexEpoch && !this.closing) {
            this.logger.error(`Rebuilding the message index failed, retrying later`, error)
            this.scheduleRetry()
            return
          }
          continue
        }
        if (epoch !== this.messageIndexEpoch || result === undefined) continue
        this.messageIndexReady = true
        // Heads whose ancestry is not readable yet, or whose announcement could not be completed,
        // keep the rest of the index usable and are retried.
        const published = await this.publishNotifications(result.notify, epoch)
        if (!result.complete || !published) this.scheduleRetry()
      }
    })()
    try {
      await this.messageIndexRefresh
    } finally {
      this.messageIndexRefresh = undefined
    }
  }

  /**
   * Walk one head's next ancestry, stopping only at fully checked ancestry. Reads come from this
   * log's accepted index; block availability alone is not membership, except for heads the log
   * itself reports (a local append persists its head before its index entry).
   * Never throws for unreadable ancestry: the head stays pending and is retried.
   */
  private async walkAncestry(head: string, epoch: number, trusted: boolean): Promise<WalkResult> {
    const ids: string[] = []
    const notify: WalkResult['notify'] = []
    const startRevision = this.authRevision
    const result = (complete: boolean): WalkResult => ({ ids, notify, complete, revision: startRevision })
    if (epoch !== this.messageIndexEpoch || this.closing) return result(false)
    const log = this.getStore().log
    const pending = this.pendingHeads.get(head)
    const notified: string[] = []
    if (this.indexedAncestry.has(head)) {
      // Already complete. Only an announcement handed back after a failed publication is owed:
      // consume the accepted entry again under the current facts and announce that result.
      if (pending?.notify) {
        const indexed = this.indexedEntries.get(head)
        const value = indexed === undefined ? undefined : await this.getStore().get(head)
        if (epoch !== this.messageIndexEpoch || this.closing) return result(false)
        const revision = this.authRevision
        const message = value == null ? undefined : await this.messagesService.onConsume(value, this.channelData)
        if (epoch !== this.messageIndexEpoch || this.closing) return result(false)
        if (message != null && message !== false && message.id === indexed!.id) {
          notify.push({ hash: head, message, revision })
          this.pendingHeads.set(head, { ...pending, notify: false })
        } else {
          this.pendingHeads.delete(head)
        }
      }
      return result(true)
    }
    type Frame = { hash: string; entry?: LogEntry<EncryptedMessage>; root?: boolean }
    const stack: Frame[] = [{ hash: head, root: true }]
    const active = new Set<string>()
    const completed = new Set<string>()
    let complete = true
    walk: while (stack.length > 0) {
      if (epoch !== this.messageIndexEpoch || this.closing) return result(false)
      const frame = stack.pop()!
      if (this.indexedAncestry.has(frame.hash) || completed.has(frame.hash)) continue
      if (frame.entry !== undefined) {
        const entry = frame.entry
        const value = entry.payload.value
        if (value?.channelId === this.channelData.id) {
          const revision = this.authRevision
          const message = await this.messagesService.onConsume(value, this.channelData)
          if (epoch !== this.messageIndexEpoch || this.closing) return result(false)
          if (message != null && message !== false) {
            this.indexMessage(entry.hash, message)
            ids.push(message.id)
            if (this.pendingHeads.get(entry.hash)?.notify) {
              notify.push({ hash: entry.hash, message, revision })
              notified.push(entry.hash)
            }
          } else {
            this.rejectedHashes.add(entry.hash)
          }
        }
        completed.add(entry.hash)
        active.delete(entry.hash)
        continue
      }

      if (active.has(frame.hash)) {
        this.logger.error('Cycle in channel message ancestry', frame.hash)
        complete = false
        break walk
      }
      const joined = await log.has(frame.hash)
      if (epoch !== this.messageIndexEpoch || this.closing) return result(false)
      let entry: LogEntry<EncryptedMessage> | undefined
      if (joined || (frame.root && trusted)) {
        entry = (await log.get(frame.hash)) as LogEntry<EncryptedMessage> | undefined
        if (epoch !== this.messageIndexEpoch || this.closing) return result(false)
      }
      if (entry == null || entry.hash !== frame.hash) {
        if (frame.root && !joined && !trusted) {
          // Shared-bus remote updates can precede our join. Log.append also publishes heads
          // before its index write completes. Neither root is ready; its local update retries.
          this.logger.debug('Ignoring a channel head this log has not joined', frame.hash)
          this.pendingHeads.delete(head)
          return result(true)
        }
        // The log considers this entry visible but its bytes are not readable right now
        // (storage lag, a partially restored store). Keep the head and retry with backoff.
        this.logger.warn('Channel entry is not readable yet, retrying later', frame.hash)
        complete = false
        break walk
      }
      active.add(entry.hash)
      stack.push({ hash: entry.hash, entry })
      // Match OrbitDB's visible-log iterator: refs are fetch shortcuts, not visible ancestry.
      for (const hash of new Set(entry.next ?? [])) {
        if (!this.indexedAncestry.has(hash)) stack.push({ hash })
      }
    }
    // Arrivals this walk announces are not announced again by their own walks; their pending
    // entries stay until the announcement is acknowledged.
    for (const hash of notified) {
      const other = this.pendingHeads.get(hash)
      if (other !== undefined) this.pendingHeads.set(hash, { ...other, notify: false })
    }
    if (!complete) {
      // Keep the head pending: consumed entries are indexed, but its ancestry is not complete,
      // so the next attempt walks it again. Its notification waits for that attempt.
      this.pendingHeads.set(head, {
        ...pending,
        notify: (pending?.notify ?? false) && !notified.includes(head),
        trusted,
      })
      return result(false)
    }
    // Commit completion only after the entire delta succeeds, so a read failure cannot hide
    // already consumed but not yet announced IDs from the next attempt.
    for (const hash of completed) {
      this.indexedAncestry.add(hash)
      if (!notified.includes(hash) && this.pendingHeads.get(hash)?.notify !== false) this.pendingHeads.delete(hash)
    }
    if (!notified.includes(head) && this.pendingHeads.get(head)?.notify !== false) this.pendingHeads.delete(head)
    return result(true)
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
      const encryptedMessage = await this.messagesService.onSend(message, this.channelData)
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
    if (this.closing) return messages
    const requestedIds = ids === undefined ? undefined : new Set(ids)
    if (requestedIds?.size === 0) return messages

    // Fetch requested IDs by their immutable log entries, then run the normal consumer under the
    // current auth epoch. Results follow the request order (callers key messages by ID); the
    // iterator, in log order, serves IDs backed by several log entries.
    if (requestedIds !== undefined && this.messageIndexReady) {
      const hashes: string[] = []
      let ambiguous = false
      for (const id of requestedIds) {
        const known = this.messageHashes.get(id)
        if (known === undefined) continue
        if (known.size !== 1) {
          ambiguous = true
          break
        }
        hashes.push(known.values().next().value!)
      }
      if (!ambiguous) {
        // Every message of the batch is served under one set of facts: an auth change mid-batch
        // restarts it, and its results are then current again.
        const epoch = this.messageIndexEpoch
        const revision = this.authRevision
        const stale = () => epoch !== this.messageIndexEpoch || revision !== this.authRevision
        for (const hash of hashes) {
          const value = await this.getStore().get(hash)
          if (stale()) return this.getEntries(ids)
          if (value == null) continue
          const message = await this.messagesService.onConsume(value, this.channelData)
          if (stale()) return this.getEntries(ids)
          if (message != null && message !== false && requestedIds.has(message.id)) messages.push(message)
        }
        return messages
      }
    }

    for await (const x of this.getStore().iterator()) {
      if (x.value == null) {
        this.logger.warn(`Orbitdb record was null`, x.hash)
        continue
      }

      if (requestedIds === undefined || requestedIds.has(x.value.id)) {
        const decryptedMessage = await this.messagesService.onConsume(x.value, this.channelData)
        if (decryptedMessage == null || decryptedMessage === false) {
          continue
        }
        if (this.channelData.type !== ChannelType.DM || !messages.some(x => x.id === decryptedMessage.id)) {
          messages.push(decryptedMessage)
        }
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
    const store = this.store
    if (store == null) {
      this.logger.warn(`Store is already undefined, nothing to close`)
      return
    }

    this.closing = true
    this.clearRetry()
    this.pendingHeads.clear()
    this.detachStoreListener()
    this.invalidateMessageIndex()
    await this.stopSync()
    await store.close()
    if (this.authListenerAttached) {
      this.auth.removeListener(SigchainEvents.UPDATED, this.handleAuthUpdated)
      this.authListenerAttached = false
    }
    this.invalidateMessageIndex()
    this.store = undefined
    this._subscribing = false
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
    const store = this.store
    this.closing = true
    this.clearRetry()
    this.pendingHeads.clear()
    this.detachStoreListener()
    this.invalidateMessageIndex()
    try {
      await this.stopSync()
    } catch (e) {
      // If we are not subscribed, this will throw an error
    }
    try {
      if (!this.store) {
        this.logger.warn(`Store is already undefined, nothing to drop`)
      } else {
        await store!.drop()
      }
    } catch (e) {
      this.logger.error(`Failed to drop store`, e)
    }
    try {
      await store?.close()
    } catch (e) {
      this.logger.error(`Failed to close store after drop`, e)
    }
    if (this.authListenerAttached) {
      this.auth.removeListener(SigchainEvents.UPDATED, this.handleAuthUpdated)
      this.authListenerAttached = false
    }
    this.invalidateMessageIndex()
    this.store = undefined
    this._subscribing = false
  }
}
