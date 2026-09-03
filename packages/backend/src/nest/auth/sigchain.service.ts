import { Inject, Injectable } from '@nestjs/common'
import { SigChain } from './sigchain'
import {
  Connection,
  InviteeMemberContext,
  Keyring,
  LocalUserContext,
  MemberContext,
  Team,
  UserWithSecrets,
  DeviceWithSecrets,
  Base58,
} from '@localfirst/auth'
import { KeyMetadata } from '@localfirst/crdx'
import { LocalDbService } from '../local-db/local-db.service'
import { createLogger } from '../common/logger'
import { SocketEvents, StorableKey } from '@quiet/types'
import { type RoleService } from './services/roles/role.service'
import { type DeviceService } from './services/members/device.service'
import { type InviteService } from './services/invites/invite.service'
import { type UserService } from './services/members/user.service'
import { type CryptoService } from './services/crypto/crypto.service'
import { SERVER_IO_PROVIDER } from '../const'
import { ServerIoProviderTypes } from '../types'
import EventEmitter from 'events'
import { SigchainEvents, StoredKeyType } from './types'
import { ModuleRef } from '@nestjs/core'
import { DeviceCredentialsUpdatedEvent, KeysUpdatedEvent } from '@quiet/types'
import type { CreateUserFromInviteSeedInput, CreateUserInput } from './services/members/types'

/** Why a write was requested; only admissions are refused past the bound. */
export type PersistKind = 'update' | 'admission'

/** The admitting team was replaced before its write could commit. */
export class AdmittingTeamReplacedError extends Error {
  constructor(teamId: string) {
    super(`The team admitting into ${teamId} is no longer the one this device holds`)
    this.name = 'AdmittingTeamReplacedError'
  }
}

/** Too many callers are already waiting on a write for this team. */
export class PersistenceBacklogError extends Error {
  constructor(teamId: string, pending: number) {
    super(`Refusing to queue another admission write for team ${teamId}: ${pending} already pending`)
    this.name = 'PersistenceBacklogError'
  }
}

/** The write was queued against a team state that a rollback has since discarded. */
export class PersistenceRolledBackError extends Error {
  constructor(teamId: string) {
    super(`Discarding a write for team ${teamId} that was queued before a rollback`)
    this.name = 'PersistenceRolledBackError'
  }
}

/**
 * Write state for one team: at most one write talking to the database and one
 * queued behind it, plus the callers waiting on that queued write.
 *
 * `generation` is what a rollback invalidates. Every queued task captures it, so
 * a task that was queued against a graph the rollback is discarding refuses to
 * run rather than committing it, or resolving an admission gate against a write
 * of the replacement.
 */
type TeamPersistState = {
  /** Settled chain of every write for this team; never rejects. */
  tail: Promise<void>
  /** An ordinary update not yet started, which later callers can join. */
  coalescedUpdate: Promise<void> | undefined
  waiters: number
  generation: number
  /** Heads already on disk, so a repeated gate for one costs no write. */
  durableHeads: Set<string>
  /** One write per head in flight, so repeated gates share a completion. */
  admissionsInFlight: Map<string, Promise<void>>
}

@Injectable()
export class SigChainService extends EventEmitter {
  /**
   * Ceiling on callers waiting for one team's write.
   *
   * Reached only when something is generating admissions far faster than the
   * disk retires them, which in practice means a peer is driving it.
   */
  private static readonly MAX_PENDING_PERSISTS_PER_TEAM = 64
  /** Heads remembered as durable per team; enough to absorb a retry burst. */
  private static readonly MAX_DURABLE_HEADS_PER_TEAM = 32

  public activeChainTeamId: string | undefined
  private readonly logger = createLogger(SigChainService.name)
  private chains: Map<string, SigChain> = new Map()
  public connections: Map<string, Connection> = new Map()
  private readonly _chainListeners: Map<SigChain, () => void> = new Map()
  /** Coalescing write state per team; see persistChain. */
  private readonly _persistQueue: Map<string, TeamPersistState> = new Map()
  /**
   * Teams whose in-memory state is known to contain something we never stored.
   * Every write for them is refused until they are back to a durable state.
   */
  private readonly _blockedTeams: Set<string> = new Set()
  /** Rollbacks performed per team, for diagnosing repeated availability loss. */
  private readonly _rollbacks: Map<string, number> = new Map()

  constructor(
    @Inject(SERVER_IO_PROVIDER) public readonly serverIoProvider: ServerIoProviderTypes,
    private readonly localDbService: LocalDbService,
    private readonly moduleRef: ModuleRef
  ) {
    super()
  }

  get chainCount(): number {
    return this.chains.size
  }

  get activeChain(): SigChain {
    return this.getActiveChain()
  }

  get users(): UserService {
    return this.getActiveChain().users
  }

  get roles(): RoleService {
    return this.getActiveChain().roles
  }

  get devices(): DeviceService {
    return this.getActiveChain().devices
  }

  get invites(): InviteService {
    return this.getActiveChain().invites
  }

  get crypto(): CryptoService {
    return this.getActiveChain().crypto
  }

  get team(): Team {
    return this.getActiveChain().team!
  }

  get context(): MemberContext | InviteeMemberContext {
    return this.getActiveChain().context
  }

  get user(): UserWithSecrets {
    return this.getActiveChain().user
  }

  get device(): DeviceWithSecrets {
    return this.getActiveChain().device
  }

  get activeTeamId(): string | undefined {
    try {
      return this.getActiveChain(false)?.teamId
    } catch {
      return undefined
    }
  }

  get activeTeamName(): string | undefined {
    try {
      return this.getActiveChain(false)?.teamName
    } catch {
      return undefined
    }
  }

  getActiveChain(throwError?: true | undefined): SigChain
  getActiveChain(throwError: false): SigChain | undefined
  getActiveChain(throwError = true): SigChain | undefined {
    if (this.activeChainTeamId == null) {
      if (throwError) throw new Error('Active team ID was nullish')
      return undefined
    }
    return this.getChain(this.activeChainTeamId, throwError as any)
  }

  getChain(teamId: string, throwError?: true | undefined): SigChain
  getChain(teamId: string, throwError: false): SigChain | undefined
  /**
   * Gets a chain by team name or ID
   * @param filter Filter query with either team name or team ID
   * @returns The chain for the team name or ID specified
   * @throws Error if the chain doesn't exist, if ID and name in filter, or no filter criteria provided
   */
  getChain(teamId: string, throwError = true): SigChain | undefined {
    if (!this.chains.has(teamId)) {
      if (throwError) {
        throw new Error(`No chain found for team ID ${teamId}`)
      }
      this.logger.warn('No chain found for ID')
      return undefined
    }
    return this.chains.get(teamId)!
  }

  setActiveChain(teamId: string): void {
    if (this.activeChainTeamId && this.activeChainTeamId !== teamId) {
      this.detachSocketListeners(this.getChain(this.activeChainTeamId))
    }
    if (!this.chains.has(teamId)) {
      throw new Error(`No chain found for team ${teamId}, can't set to active!`)
    }
    this.activeChainTeamId = teamId
    this.attachSocketListeners(this.getChain(teamId))
  }

  /**
   * Handles an in-memory mutation of a team's sigchain.
   *
   * The chain is written to disk *before* the UPDATED event goes out. Anything
   * downstream of that event may release material that only makes sense if the
   * entry we just appended survives a restart (QSS-006): if we emit first and
   * crash before the write lands, we come back without an admission the peer is
   * already relying on, and that peer is then rejected as an unknown device.
   *
   * This used to fire two un-awaited writes of the same value, so the emit
   * raced both of them and neither failure was visible to any caller. It is now
   * a single awaited write through the per-team queue, and a rejection
   * propagates to the caller so admission paths can fail closed.
   */
  private handleChainUpdate = async (teamId: string): Promise<void> => {
    await this.persistChain(teamId)
    void this.updateKeysInNativeStorage(teamId).catch(err => {
      this.logger.error('Failed to update iOS keychain on chain update', err)
    })
    this.updateDeviceCredentials(teamId)
    this.emit(SigchainEvents.UPDATED, teamId)
    this.logger.info('Chain updated and persisted, emitted updated event', teamId)
  }

  /**
   * Update mobile native storage with any new keys.
   *
   * Like updateDeviceCredentials, this must run on steady state (QSS sign-in),
   * not only on chain mutation: the native push handler needs the LFA role keys
   * to decrypt fetched entries, and a device that joined and then saw no chain
   * update would otherwise throw MissingQssNotificationKeyException on every push.
   *
   * The local "stored in keychain" ledger only proves we *emitted* a key once, not
   * that native storage still holds it (dropped emit, saga not yet listening, app
   * reinstalled while the backend db persisted). So callers at steady state pass
   * resendAll=true to emit every key regardless of the ledger; native storage is a
   * put, so this is idempotent. The ledger is still only appended with new names.
   *
   * @param resendAll Emit all keys even if the ledger says they were already sent
   */
  public async updateKeysInNativeStorage(teamId: string, resendAll = false): Promise<void> {
    const platform = process.platform as string
    if (platform !== 'ios' && platform !== 'android') {
      this.logger.trace('Skipping key update because we are not on mobile, current platform =', process.platform)
      return
    }

    if (process.env.QPS_ALLOWED !== 'true') {
      this.logger.trace('Not updating IOS keychain because QPS is not allowed in this environment')
      return
    }

    const generateKeyName = (teamId: string, keyType: string, scope: KeyMetadata): string => {
      return `quiet_${teamId}_${scope.type}_${scope.name}_${scope.generation}_${keyType}`
    }

    const sigchain = this.getChain(teamId)
    if (sigchain == null) {
      this.logger.error('No chain for ID found', teamId)
      return
    }

    await this._ensureDb()
    const alreadySentKeys: Set<string> = new Set(await this.localDbService.getKeysStoredInKeychain(teamId))
    const keysToSend: StorableKey[] = []
    const keyNamesSent: string[] = []
    // get all secret keys that this user has that haven't been added to the keychain
    const allKeys = sigchain.crypto.getAllKeys()
    for (const keyData of Object.values(allKeys)) {
      for (const keyTypeData of Object.values(keyData)) {
        for (const keyTypeGenData of Object.values(keyTypeData)) {
          const keyName = generateKeyName(teamId, StoredKeyType.SECRET, {
            name: keyTypeGenData.name,
            type: keyTypeGenData.type,
            generation: keyTypeGenData.generation,
          })
          const isNew = !alreadySentKeys.has(keyName)
          if (resendAll || isNew) {
            keysToSend.push({ key: keyTypeGenData.secretKey, keyName })
          }
          if (isNew) {
            keyNamesSent.push(keyName)
          }
        }
      }
    }
    // TODO: update to pull all generations of user public/sig keys
    // get all user public keys that haven't been added to the keychain
    const allUserPublicKeys = sigchain.crypto.getPublicKeysForAllMembers(true)
    for (const keySet of allUserPublicKeys) {
      const publicKeyName = generateKeyName(teamId, StoredKeyType.USER_PUBLIC, {
        name: keySet.name,
        type: keySet.type,
        generation: keySet.generation,
      })
      const isNewPublicKey = !alreadySentKeys.has(publicKeyName)
      if (resendAll || isNewPublicKey) {
        keysToSend.push({ key: keySet.encryption, keyName: publicKeyName })
      }
      if (isNewPublicKey) {
        keyNamesSent.push(publicKeyName)
      }

      const sigKeyName = generateKeyName(teamId, StoredKeyType.USER_SIG, {
        name: keySet.name,
        type: keySet.type,
        generation: keySet.generation,
      })
      const isNewSigKey = !alreadySentKeys.has(sigKeyName)
      if (resendAll || isNewSigKey) {
        keysToSend.push({ key: keySet.signature, keyName: sigKeyName })
      }
      if (isNewSigKey) {
        keyNamesSent.push(sigKeyName)
      }
    }

    if (keysToSend.length === 0) {
      this.logger.trace('Skipping native key update, no new keys')
      return
    }

    // send keys to the state manager to add to native storage; only record names not
    // already in the ledger so forced resends do not grow it
    const keyUpdateEvent: KeysUpdatedEvent = {
      keys: keysToSend,
    }
    if (keyNamesSent.length > 0) {
      await this.localDbService.updateKeysStoredInKeychain(teamId, keyNamesSent)
    }
    this.serverIoProvider.io.emit(SocketEvents.KEYS_UPDATED, keyUpdateEvent)
    this.logger.info(
      `Emitted ${keysToSend.length} keys to native storage (${keyNamesSent.length} new, resendAll=${resendAll})`
    )
  }

  /**
   * Emit device credentials to mobile clients so native background handlers can
   * authenticate with QSS.
   *
   * Must be emitted whenever the client reaches a steady state for a team, not
   * only when the chain mutates: the native FCM handler cannot fetch log entries
   * without a device id, so a device that joins and then sees no membership
   * changes would never be able to render a push notification.
   */
  public updateDeviceCredentials(teamId: string): void {
    const platform = process.platform as string
    if (platform !== 'ios' && platform !== 'android') return
    if (process.env.QPS_ALLOWED !== 'true') {
      this.logger.trace('Not emitting device credentials because QPS is not allowed in this environment')
      return
    }
    try {
      const sigchain = this.getChain(teamId)
      if (sigchain?.team == null) return
      const device = sigchain.device
      if (!device?.deviceId || !device.keys?.signature?.secretKey) {
        this.logger.warn('Device credentials not available, skipping NSE credential update')
        return
      }
      const event: DeviceCredentialsUpdatedEvent = {
        deviceId: device.deviceId,
        teamId,
        signingPrivateKey: device.keys.signature.secretKey,
      }
      this.serverIoProvider.io.emit(SocketEvents.DEVICE_CREDENTIALS_UPDATED, event)
      this.logger.info('Emitted device credentials for NSE')
    } catch (e) {
      this.logger.error('Failed to emit device credentials', e)
    }
  }

  private attachSocketListeners(chain: SigChain): void {
    this.logger.info('Attaching socket listeners')
    const listener = (): void => {
      // EventEmitter cannot await us, so a rejected persist would otherwise
      // surface as an unhandled rejection. Log it loudly with the team ID.
      // Wrapped rather than chained directly: tests stub handleChainUpdate with a
      // plain function, and a void return has no catch to call.
      void Promise.resolve(this.handleChainUpdate(chain.teamId!)).catch(err => {
        this.logger.error(`Failed to handle chain update for team ${chain.teamId}`, err)
      })
    }
    this._chainListeners.set(chain, listener)
    chain.on(SigchainEvents.UPDATED, listener)
  }

  private detachSocketListeners(chain: SigChain): void {
    this.logger.info('Detaching socket listeners')
    const listener = this._chainListeners.get(chain)
    if (listener) {
      chain.removeListener(SigchainEvents.UPDATED, listener)
      this._chainListeners.delete(chain)
    }
  }

  /**
   * Adds a chain to the service
   * @param chain SigChain to add
   * @param setActive Whether to set the chain as active
   * @param teamName Optional name of the team
   * @param teamId Optionally pass in the team ID
   * @returns Whether the chain was set as active
   */
  addChain(chain: SigChain, setActive: boolean, teamId: string): boolean {
    if (this.chains.has(teamId)) {
      throw new Error(`Chain for team ${teamId} already exists`)
    }
    this.chains.set(teamId, chain)
    if (setActive) {
      this.setActiveChain(teamId)
      return true
    }

    return false
  }

  /**
   * Deletes a chain from the service
   * @param teamName Name of the team to delete
   * @param fromDisk Whether to delete the chain from disk as well
   */
  async deleteChain(teamId: string, fromDisk: boolean): Promise<void> {
    const chain = this.chains.get(teamId)
    if (chain) {
      this.detachSocketListeners(chain)
    }
    if (fromDisk) {
      // Abandon anything queued and wait for whatever is mid-write before
      // deleting, or a write already holding serialized bytes lands afterwards
      // and puts the record straight back.
      const state = this._persistQueue.get(teamId)
      if (state != null) {
        state.generation += 1
        state.coalescedUpdate = undefined
        state.admissionsInFlight.clear()
        state.durableHeads.clear()
        await state.tail
      }
      await this.localDbService.deleteSigChain(teamId)
      this._persistQueue.delete(teamId)
    }
    this.chains.delete(teamId)
    if (this.activeChainTeamId === teamId) {
      this.activeChainTeamId = undefined
    }
  }

  /**
   * Creates a new chain and adds it to the service
   * @param teamName Name of the team to create
   * @param setActive Whether to set the chain as active
   * @param createUserInput Optional input to create user
   * @returns The created chain
   */
  async createChain(setActive: boolean, createUserInput: CreateUserInput = {}): Promise<SigChain> {
    const sigChain = SigChain.create(createUserInput)
    this.addChain(sigChain, setActive, sigChain.teamId!)
    await this.saveChain(sigChain.teamId!)
    await this.handleChainUpdate(sigChain.teamId!)
    return sigChain
  }

  async createChainFromInvite(
    createFromInviteSeedInput: CreateUserFromInviteSeedInput,
    teamId: string,
    setActive: boolean
  ): Promise<SigChain> {
    this.logger.info('Creating chain from invite')
    const sigChain = SigChain.createFromInvite(createFromInviteSeedInput, teamId as Base58)
    this.addChain(sigChain, setActive, teamId)
    await this.saveChain(teamId)
    return sigChain
  }

  /**
   * Deserializes a chain and adds it to the service
   * @param serializedTeam Serialized chain to deserialize
   * @param localUserContext User context to use for the chain
   * @param teamKeyRing Keyring to use for the chain
   * @param setActive Whether to set the chain as active
   * @returns The SigChain instance created from the serialized chain
   */
  private async deserialize(
    serializedTeam: Uint8Array,
    localUserContext: LocalUserContext,
    teamKeyRing: Keyring,
    setActive: boolean
  ): Promise<SigChain> {
    this.logger.info('Deserializing chain')
    const sigChain = SigChain.load(serializedTeam, localUserContext, teamKeyRing)
    this.addChain(sigChain, setActive, sigChain.teamId!)
    return sigChain
  }

  /* LevelDB methods */

  /**
   * Loads a chain from disk and adds it to the service
   * @param teamId ID of the team to load
   * @param setActive Whether to set the chain as active
   * @returns The SigChain instance loaded from disk
   * @throws Error if the chain doesn't exist
   */
  async loadChain(teamId: string, setActive: boolean): Promise<SigChain> {
    await this._ensureDb()
    this.logger.info(`Loading chain for team ${teamId}`)
    const chainData = await this.localDbService.getSigChain(teamId)
    if (!chainData) {
      throw new Error(`Chain for team ${teamId} not found`)
    }
    if (!chainData.serializedTeam) {
      throw new Error(`Chain for team ${teamId} is missing serialized team`)
    }
    if (!chainData.teamKeyRing) {
      throw new Error(`Chain for team ${teamId} is missing keyring`)
    }
    return await this.deserialize(
      chainData.serializedTeam,
      chainData.localUserContext,
      chainData.teamKeyRing,
      setActive
    )
  }

  /**
   * Durably writes a team's sigchain (graph + team keyring) to disk.
   *
   * Writes for a given team are queued one behind another. Without that, two
   * overlapping writes each serialize the live team object at the moment they
   * reach LevelDB, so a write that started earlier can land after a write that
   * started later and commit a stale graph over a newer one - silently dropping
   * an entry we already told a peer about.
   *
   * The returned promise rejects if the write fails. Callers that are about to
   * release credentials or an acceptance message must await it and fail closed,
   * rather than treating persistence as best effort (QSS-006).
   *
   * @param teamId ID of the team whose chain should be persisted
   */
  public persistChain(teamId: string, kind: PersistKind = 'update'): Promise<void> {
    const state = this.stateFor(teamId)

    if (kind === 'admission' && state.waiters >= SigChainService.MAX_PENDING_PERSISTS_PER_TEAM) {
      const error = new PersistenceBacklogError(teamId, state.waiters)
      this.logger.error(error.message)
      return Promise.reject(error)
    }

    let write = state.coalescedUpdate
    if (write == null) {
      const slot: { write?: Promise<void> } = {}
      write = this.enqueue(teamId, state, async generation => {
        // Free the slot as this write starts, never when it finishes, so a
        // caller arriving now opens a fresh one that covers its own mutation.
        if (state.coalescedUpdate === slot.write) {
          state.coalescedUpdate = undefined
        }
        await this.writeLiveChain(teamId, state, generation)
      })
      slot.write = write
      state.coalescedUpdate = write
    }
    return this.track(state, write)
  }

  /**
   * Durably writes the exact team an LFA connection has just admitted into.
   *
   * This is the durable-admission gate, and it is bound to the object it is
   * handed rather than to the team ID. Looking the team up by ID instead lets a
   * rollback that has already installed a clean replacement satisfy this gate
   * with a write of that replacement, while the connection goes on to release an
   * acceptance serialized from the discarded graph, carrying an admission that
   * never reached disk. The identity is therefore checked when the write is
   * queued and again immediately before its bytes are produced.
   *
   * Repeated gates for one head share a single write, and a head already on disk
   * costs none, so a peer that re-runs the handshake cannot consume the backlog
   * bound or provoke a rollback (audit L-2).
   *
   * @param team The team the connection appended the admission to
   * @throws AdmittingTeamReplacedError if this is no longer the team we hold,
   *   PersistenceBacklogError past the bound, PersistenceRolledBackError if a
   *   rollback discarded this state, or the underlying write failure
   */
  public async persistAdmittedTeam(team: Team): Promise<void> {
    const teamId = team.id
    this.assertAdmittingTeamIsCurrent(team)

    const state = this.stateFor(teamId)
    const head = SigChainService.headKey(team)

    if (state.durableHeads.has(head)) {
      this.logger.info(`Admission for team ${teamId} at head ${head} is already durable`)
      return
    }

    const inFlight = state.admissionsInFlight.get(head)
    if (inFlight != null) {
      this.logger.info(`Joining the in-flight admission write for team ${teamId}`)
      await inFlight
      return
    }

    if (state.waiters >= SigChainService.MAX_PENDING_PERSISTS_PER_TEAM) {
      const error = new PersistenceBacklogError(teamId, state.waiters)
      this.logger.error(error.message)
      throw error
    }

    const write = this.track(
      state,
      this.enqueue(teamId, state, async generation => this.writeAdmittedTeam(teamId, team, state, generation))
    )
    state.admissionsInFlight.set(head, write)
    try {
      await write
      SigChainService.rememberDurableHead(state, head)
    } finally {
      state.admissionsInFlight.delete(head)
    }
  }

  /**
   * Fails closed unless this is still exactly the team this device holds.
   *
   * @param team The team an admission was appended to
   */
  private assertAdmittingTeamIsCurrent(team: Team): void {
    const chain = this.getChain(team.id, false)
    if (chain == null || chain.team !== team) {
      const error = new AdmittingTeamReplacedError(team.id)
      this.logger.error(error.message)
      throw error
    }
  }

  /** Write state for a team, created on first use. */
  private stateFor(teamId: string): TeamPersistState {
    let state = this._persistQueue.get(teamId)
    if (state == null) {
      state = {
        tail: Promise.resolve(),
        coalescedUpdate: undefined,
        waiters: 0,
        generation: 0,
        durableHeads: new Set<string>(),
        admissionsInFlight: new Map<string, Promise<void>>(),
      }
      this._persistQueue.set(teamId, state)
    }
    return state
  }

  /**
   * Queues one write behind everything already queued for this team.
   *
   * The generation is captured here and rechecked when the task runs, so a task
   * queued before a rollback refuses rather than committing a graph the rollback
   * is discarding, or resolving an admission gate against a write of the
   * replacement.
   *
   * @param teamId Team being written
   * @param state That team's write state
   * @param run The write itself, given the generation it was queued in
   */
  private enqueue(teamId: string, state: TeamPersistState, run: (generation: number) => Promise<void>): Promise<void> {
    const generation = state.generation
    const guarded = async (): Promise<void> => {
      if (state.generation !== generation) {
        throw new PersistenceRolledBackError(teamId)
      }
      await run(generation)
    }
    // Order after the previous write either way: a failed write must not wedge
    // the queue, and the stored tail must never be a rejection nobody handles.
    const current = state.tail.then(guarded, guarded)
    state.tail = current.then(
      () => undefined,
      () => undefined
    )
    return current
  }

  /** Counts a caller against the team's backlog for as long as it waits. */
  private track(state: TeamPersistState, write: Promise<void>): Promise<void> {
    state.waiters += 1
    return write.finally(() => {
      state.waiters -= 1
    })
  }

  /** Writes whatever the chain currently holds. */
  private async writeLiveChain(teamId: string, state: TeamPersistState, generation: number): Promise<void> {
    try {
      this.logger.info(`Saving chain to disk`, teamId)
      await this._ensureDb()
      this.assertWritable(teamId, state, generation)
      await this.localDbService.setSigChain(this.getChain(teamId), teamId)
    } catch (err) {
      this.logger.error(`Failed to persist sigchain for team ${teamId}`, err)
      throw err
    }
  }

  /** Writes exactly the team an admission was appended to, or refuses. */
  private async writeAdmittedTeam(
    teamId: string,
    team: Team,
    state: TeamPersistState,
    generation: number
  ): Promise<void> {
    try {
      this.logger.info(`Saving the admitting team to disk`, teamId)
      await this._ensureDb()
      this.assertWritable(teamId, state, generation)
      // Re-check identity immediately before the bytes are produced: the awaits
      // above are exactly where a rollback can install a replacement.
      const chain = this.getChain(teamId)
      if (chain.team !== team) {
        throw new AdmittingTeamReplacedError(teamId)
      }
      await this.localDbService.setSigChainFromTeam(team, chain.localUserContext, teamId)
    } catch (err) {
      this.logger.error(`Failed to persist the admitting team for ${teamId}`, err)
      throw err
    }
  }

  /** Refuses a write whose generation is retired or whose team is blocked. */
  private assertWritable(teamId: string, state: TeamPersistState, generation: number): void {
    if (state.generation !== generation) {
      throw new PersistenceRolledBackError(teamId)
    }
    if (this._blockedTeams.has(teamId)) {
      throw new Error(`Refusing to write team ${teamId}: it holds state that was never persisted`)
    }
  }

  /** Canonical key for a team's current graph heads. */
  private static headKey(team: Team): string {
    const graph = team.graph as unknown as { head: string[] }
    return [...graph.head].sort().join(',')
  }

  /** Records a head as durable, keeping the record bounded. */
  private static rememberDurableHead(state: TeamPersistState, head: string): void {
    state.durableHeads.add(head)
    while (state.durableHeads.size > SigChainService.MAX_DURABLE_HEADS_PER_TEAM) {
      const oldest = state.durableHeads.values().next().value
      if (oldest == null) break
      state.durableHeads.delete(oldest)
    }
  }

  /**
   * Marks a team's in-memory state as untrustworthy, synchronously.
   *
   * Split from the reload because the guard has to be in place at the instant
   * the gate fails, with no await in between. From here every queued task is a
   * stale generation and refuses to run, every new write is refused, and every
   * admission gate holding the discarded team fails its identity check. Nothing
   * can commit the un-persisted link while the reload does its own awaiting.
   *
   * @param teamId The team whose memory state is being discarded
   * @returns The generation that has just been retired
   */
  public beginChainRollback(teamId: string): number {
    const state = this.stateFor(teamId)
    const retired = state.generation
    state.generation += 1
    state.coalescedUpdate = undefined
    state.admissionsInFlight.clear()
    state.durableHeads.clear()
    this._blockedTeams.add(teamId)
    this._rollbacks.set(teamId, (this._rollbacks.get(teamId) ?? 0) + 1)
    this.logger.warn(
      `Rolling team ${teamId} back to durable state: generation ${retired} retired, ` +
        `rollback ${this._rollbacks.get(teamId)} for this team`
    )
    return retired
  }

  /**
   * Puts a team back to the last state this device actually stored.
   *
   * Must follow beginChainRollback, which is what makes the window safe. This
   * half waits for any write already talking to the database to settle before
   * reading, so a put that was serialized before the rollback cannot land after
   * the reload and reintroduce the discarded graph. Only then is the stored team
   * installed and the new generation unblocked.
   *
   * If there is nothing durable to rebuild from, writes stay blocked. Refusing
   * to write anything for the team is the correct failure: committing the link
   * is the outcome the gate exists to prevent.
   *
   * @param teamId The team to roll back
   */
  public async restoreChainToDurableState(teamId: string): Promise<void> {
    const state = this._persistQueue.get(teamId)
    // Fence: the tail never rejects, and settling it means no earlier put is
    // still holding serialized bytes we are about to read past.
    if (state != null) {
      await state.tail
    }

    await this._ensureDb()
    const stored = await this.localDbService.getSigChain(teamId)
    if (stored?.serializedTeam == null || stored.teamKeyRing == null) {
      this.logger.error(`Cannot restore team ${teamId}: nothing durable to restore to, writes stay blocked`)
      throw new Error(`No durable state to restore for team ${teamId}`)
    }
    this.getChain(teamId).restoreTeam(stored.serializedTeam, stored.localUserContext, stored.teamKeyRing)
    this._blockedTeams.delete(teamId)
    this.logger.info(`Restored team ${teamId} to its last durable state`)
  }

  /** How many times this team has been rolled back; for diagnostics. */
  public rollbackCount(teamId: string): number {
    return this._rollbacks.get(teamId) ?? 0
  }

  /** Whether writes for this team are currently refused; for tests and diagnostics. */
  public isChainBlocked(teamId: string): boolean {
    return this._blockedTeams.has(teamId)
  }

  /** Callers currently waiting on a write for this team; for tests and diagnostics. */
  public pendingPersistCount(teamId: string): number {
    return this._persistQueue.get(teamId)?.waiters ?? 0
  }

  /**
   * Saves a chain to disk.
   *
   * Retained as the historical name for persistChain; both go through the same
   * per-team write queue.
   *
   * @param teamId ID of the team to save
   */
  async saveChain(teamId: string): Promise<void> {
    await this.persistChain(teamId)
  }

  private async _ensureDb(): Promise<void> {
    if (this.localDbService.getStatus() !== 'open') {
      this.logger.warn(`LocalDbService wasn't open, opening now!`)
      await this.localDbService.open()
    }
  }
}
