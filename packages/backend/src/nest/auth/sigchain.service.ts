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

@Injectable()
export class SigChainService extends EventEmitter {
  public activeChainTeamId: string | undefined
  private readonly logger = createLogger(SigChainService.name)
  private chains: Map<string, SigChain> = new Map()
  public connections: Map<string, Connection> = new Map()
  private readonly _chainListeners: Map<SigChain, () => void> = new Map()
  /**
   * Tail of the in-flight write chain for each team, keyed by team ID.
   *
   * The stored promise never rejects, so a failed write does not poison later
   * writes for the same team; see persistChain.
   */
  private readonly _persistQueue: Map<string, Promise<void>> = new Map()

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
      void this.handleChainUpdate(chain.teamId!).catch(err => {
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
      this.localDbService.deleteSigChain(teamId)
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
  public persistChain(teamId: string): Promise<void> {
    const write = async (): Promise<void> => {
      try {
        this.logger.info(`Saving chain to disk`, teamId)
        await this._ensureDb()
        const chain = this.getChain(teamId)
        await this.localDbService.setSigChain(chain, teamId)
      } catch (err) {
        this.logger.error(`Failed to persist sigchain for team ${teamId}`, err)
        throw err
      }
    }

    // The queued tail never rejects, so one failed write does not cascade into
    // every later write for the same team.
    const previous = this._persistQueue.get(teamId)
    const result = previous == null ? write() : previous.then(write)
    const tail = result.then(
      () => undefined,
      () => undefined
    )
    this._persistQueue.set(teamId, tail)
    void tail.then(() => {
      if (this._persistQueue.get(teamId) === tail) {
        this._persistQueue.delete(teamId)
      }
    })
    return result
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
