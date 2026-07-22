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
import { QSS_ENDPOINT, SERVER_IO_PROVIDER } from '../const'
import { ServerIoProviderTypes } from '../types'
import EventEmitter from 'events'
import { SigchainEvents, StoredKeyType } from './types'
import { ModuleRef } from '@nestjs/core'
import { DeviceCredentialsUpdatedEvent, KeysUpdatedEvent } from '@quiet/types'
import type { CreateUserFromInviteSeedInput, CreateUserInput } from './services/members/types'
import { LOCAL_QSS_HOST_PATTERN } from '../qss/qss.const'

@Injectable()
export class SigChainService extends EventEmitter {
  public activeChainTeamId: string | undefined
  private readonly logger = createLogger(SigChainService.name)
  private chains: Map<string, SigChain> = new Map()
  public connections: Map<string, Connection> = new Map()
  private readonly _chainListeners: Map<SigChain, () => void> = new Map()

  constructor(
    @Inject(SERVER_IO_PROVIDER) public readonly serverIoProvider: ServerIoProviderTypes,
    @Inject(QSS_ENDPOINT) private readonly qssEndpoint: string | undefined,
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

  private handleChainUpdate = async (teamId: string) => {
    this.saveChain(teamId)
    this.logger.info('Chain updated, emitted updated event')
    void this._updateKeysOnChainUpdate(teamId).catch(err => {
      this.logger.error('Failed to update iOS keychain on chain update', err)
    })
    this._updateDeviceCredentials(teamId)
    void this.saveChain(teamId).catch(err => {
      this.logger.error('Failed to save chain after update', err)
    })
    this.emit(SigchainEvents.UPDATED, teamId)
    this.logger.info('Chain updated, emitted updated event')

    await this.emitServerAddedIfNeeded(teamId)
  }

  private async emitServerAddedIfNeeded(teamId: string): Promise<void> {
    const chain = this.getChain(teamId, false)

    if (chain?.team != null) {
      const community = await this.localDbService.getCurrentCommunity()
      if (community) {
        const teamServerHosts = chain.team.servers().map(s => s.host)
        const normalizedTeamServerHosts = teamServerHosts.map(host => this.normalizeServerHost(host))
        const communityHostsSet = new Set(
          community.serverHosts?.map(serverHost => this.normalizeServerHost(serverHost.hostUrl)) || []
        )
        const teamHostsSet = new Set(normalizedTeamServerHosts)
        const setsAreEqual =
          communityHostsSet.size === teamHostsSet.size && [...communityHostsSet].every(h => teamHostsSet.has(h))
        const configuredQssHost = this.getConfiguredQssHost()
        const hasUnrecognizedServer =
          configuredQssHost != null && normalizedTeamServerHosts.some(serverHost => serverHost !== configuredQssHost)
        if ((!setsAreEqual || hasUnrecognizedServer) && teamServerHosts.length > 0) {
          this.serverIoProvider.io.emit(SocketEvents.SERVER_ADDED, { id: community.id, serverHosts: teamServerHosts })
        }
      }
    }
  }

  private getConfiguredQssHost(): string | undefined {
    if (!this.qssEndpoint) {
      return undefined
    }

    try {
      return this.normalizeServerHost(new URL(this.qssEndpoint).hostname)
    } catch {
      this.logger.warn(`Cannot compare server hosts against invalid QSS endpoint: ${this.qssEndpoint}`)
      return undefined
    }
  }

  private normalizeServerHost(serverHost: string): string {
    try {
      const endpoint = /^[a-z][a-z\d+.-]*:\/\//i.test(serverHost) ? serverHost : `ws://${serverHost}`
      const hostname = new URL(endpoint).hostname.toLowerCase().replace(/^\[|\]$/g, '')
      return LOCAL_QSS_HOST_PATTERN.test(hostname) ? 'localhost' : hostname
    } catch {
      return serverHost.toLowerCase()
    }
  }

  /**
   * Update mobile native storage with any new keys on chain update.
   */
  private async _updateKeysOnChainUpdate(teamId: string): Promise<void> {
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
          if (!alreadySentKeys.has(keyName)) {
            keysToSend.push({ key: keyTypeGenData.secretKey, keyName })
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
      if (!alreadySentKeys.has(publicKeyName)) {
        keysToSend.push({ key: keySet.encryption, keyName: publicKeyName })
        keyNamesSent.push(publicKeyName)
      }

      const sigKeyName = generateKeyName(teamId, StoredKeyType.USER_SIG, {
        name: keySet.name,
        type: keySet.type,
        generation: keySet.generation,
      })
      if (!alreadySentKeys.has(sigKeyName)) {
        keysToSend.push({ key: keySet.signature, keyName: sigKeyName })
        keyNamesSent.push(sigKeyName)
      }
    }

    if (keysToSend.length === 0) {
      this.logger.trace('Skipping native key update, no new keys')
      return
    }

    // send new keys to the state manager to add to the keychain and update list of key names in
    const keyUpdateEvent: KeysUpdatedEvent = {
      keys: keysToSend,
    }
    await this.localDbService.updateKeysStoredInKeychain(teamId, keyNamesSent)
    this.serverIoProvider.io.emit(SocketEvents.KEYS_UPDATED, keyUpdateEvent)
  }

  /**
   * Emit device credentials to mobile clients so native background handlers can
   * authenticate with QSS.
   */
  private _updateDeviceCredentials(teamId: string): void {
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
      this.handleChainUpdate(chain.teamId!)
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
    this.handleChainUpdate(sigChain.teamId!)
    return sigChain
  }

  async createChainFromInvite(
    createFromInviteSeedInput: CreateUserFromInviteSeedInput,
    teamId: string,
    setActive: boolean
  ): Promise<SigChain> {
    this.logger.info('Creating chain from invite')
    const sigChain = SigChain.createFromInvite(createFromInviteSeedInput)
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
   * Saves a chain to disk
   * @param teamName Name of the team to save
   */
  async saveChain(teamId: string): Promise<void> {
    this.logger.info(`Saving chain to disk`, teamId)
    await this._ensureDb()
    const chain = this.getChain(teamId)
    await this.localDbService.setSigChain(chain, teamId)
  }

  private async _ensureDb(): Promise<void> {
    if (this.localDbService.getStatus() !== 'open') {
      this.logger.warn(`LocalDbService wasn't open, opening now!`)
      await this.localDbService.open()
    }
  }
}
