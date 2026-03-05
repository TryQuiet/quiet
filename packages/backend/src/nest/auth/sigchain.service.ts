import { Inject, Injectable } from '@nestjs/common'
import { SigChain } from './sigchain'
import {
  Connection,
  Hash,
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
import { SocketEvents, StorableKey, User } from '@quiet/types'
import { type RoleService } from './services/roles/role.service'
import { type DeviceService } from './services/members/device.service'
import { type InviteService } from './services/invites/invite.service'
import { type UserService } from './services/members/user.service'
import { type CryptoService } from './services/crypto/crypto.service'
import { SERVER_IO_PROVIDER } from '../const'
import { ServerIoProviderTypes } from '../types'
import EventEmitter from 'events'
import { GetChainFilter, StoredKeyType } from './types'
import { KeysUpdatedEvent } from '@quiet/types'

@Injectable()
export class SigChainService extends EventEmitter {
  public activeChainTeamName: string | undefined
  private readonly logger = createLogger(SigChainService.name)
  private chains: Map<string, SigChain> = new Map()
  public connections: Map<string, Connection> = new Map()

  constructor(
    @Inject(SERVER_IO_PROVIDER) public readonly serverIoProvider: ServerIoProviderTypes,
    private readonly localDbService: LocalDbService
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

  getActiveChain(throwError?: true | undefined): SigChain
  getActiveChain(throwError: false): SigChain | undefined
  getActiveChain(throwError = true): SigChain | undefined {
    return this.getChain({ teamName: this.activeChainTeamName }, throwError as any)
  }

  getChain(filter: GetChainFilter, throwError?: true | undefined): SigChain
  getChain(filter: GetChainFilter, throwError: false): SigChain | undefined
  /**
   * Gets a chain by team name or ID
   * @param filter Filter query with either team name or team ID
   * @returns The chain for the team name or ID specified
   * @throws Error if the chain doesn't exist, if ID and name in filter, or no filter criteria provided
   */
  getChain(filter: GetChainFilter, throwError = true): SigChain | undefined {
    // reject filters with both team name and ID
    if (filter.teamName != null && filter.teamId != null) {
      throw new Error('Must provide only one of `teamName` or `teamId` in filter query, not both!')
    }

    // reject filters without ID or name
    if (filter.teamName == null && filter.teamId == null) {
      throw new Error('Must provide one of `teamName` or `teamId` in filter query!')
    }

    if (filter.teamId != null) {
      for (const potentialChain of this.chains.values()) {
        if (potentialChain.team != null && potentialChain.team.id === filter.teamId) {
          return potentialChain
        }
      }

      if (throwError) {
        throw new Error(`No chain found for team ID ${filter.teamId}`)
      } else {
        return undefined
      }
    }

    if (!this.chains.has(filter.teamName!) && throwError) {
      throw new Error(`No chain found for team ${filter.teamName}`)
    }
    return this.chains.get(filter.teamName!)!
  }

  setActiveChain(teamName: string): void {
    if (this.activeChainTeamName && this.activeChainTeamName !== teamName) {
      this.detachSocketListeners(this.getChain({ teamName: this.activeChainTeamName }))
    }
    if (!this.chains.has(teamName)) {
      throw new Error(`No chain found for team ${teamName}, can't set to active!`)
    }
    this.activeChainTeamName = teamName
    this.attachSocketListeners(this.getChain({ teamName }))
  }

  private handleChainUpdate = (teamName: string) => {
    this._updateUsersOnChainUpdate(teamName)
    this._updateKeysOnChainUpdate(teamName)
    this.emit('updated', teamName)
    this.saveChain(teamName)
    this.logger.info('Chain updated, emitted updated event')
  }

  /**
   * Send updated list of users to the state manager on chain update
   */
  private _updateUsersOnChainUpdate(teamName: string) {
    const users = this.getChain({ teamName })
      .team?.members()
      .map(user => ({
        userId: user.userId,
        roles: user.roles,
        isRegistered: true,
        isDuplicated: false,
      })) as User[]
    this.serverIoProvider.io.emit(SocketEvents.USERS_UPDATED, { users })
  }

  /**
   * Update the IOS keychain with any new keys on chain update
   */
  private async _updateKeysOnChainUpdate(teamName: string): Promise<void> {
    if ((process.platform as string) !== 'ios') {
      this.logger.trace('Skipping key update because we are not on ios, current platform =', process.platform)
      return
    }

    const generateKeyName = (teamId: string, keyType: string, scope: KeyMetadata): string => {
      return `quiet_${teamId}_${scope.type}_${scope.name}_${scope.generation}_${keyType}`
    }

    const sigchain = this.getChain({ teamName })
    if (sigchain == null) {
      this.logger.error('No chain for name found', teamName)
      return
    }

    const teamId = sigchain.team!.id
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
      this.logger.trace('Skipping IOS keychain update, no new keys')
      return
    }

    // send new keys to the state manager to add to the keychain and update list of key names in
    const keyUpdateEvent: KeysUpdatedEvent = {
      keys: keysToSend,
    }
    await this.localDbService.updateKeysStoredInKeychain(teamId, keyNamesSent)
    this.serverIoProvider.io.emit(SocketEvents.KEYS_UPDATED, keyUpdateEvent)
  }

  private attachSocketListeners(chain: SigChain): void {
    this.logger.info('Attaching socket listeners')
    const _onTeamUpdate = (): void => {
      this.handleChainUpdate(chain.team!.teamName)
    }
    chain.on('updated', _onTeamUpdate)
  }

  private detachSocketListeners(chain: SigChain): void {
    this.logger.info('Detaching socket listeners')
    const _onTeamUpdate = (): void => {
      this.handleChainUpdate(chain.team!.teamName)
    }
    chain.removeListener('updated', _onTeamUpdate)
  }

  /**
   * Adds a chain to the service
   * @param chain SigChain to add
   * @param setActive Whether to set the chain as active
   * @param teamName Optional name of the team
   * @param teamId Optionally pass in the team ID
   * @returns Whether the chain was set as active
   */
  addChain(chain: SigChain, setActive: boolean, teamName?: string, teamId?: string): boolean {
    teamName = teamName || chain.team!.teamName
    if (this.chains.has(teamName)) {
      throw new Error(`Chain for team ${teamName} already exists`)
    }
    this.chains.set(teamName, chain)
    if (setActive) {
      this.setActiveChain(teamName)
      return true
    }

    return false
  }

  /**
   * Deletes a chain from the service
   * @param teamName Name of the team to delete
   * @param fromDisk Whether to delete the chain from disk as well
   */
  async deleteChain(teamName: string, fromDisk: boolean): Promise<void> {
    if (fromDisk) {
      this.localDbService.deleteSigChain(teamName)
    }
    this.chains.delete(teamName)
    if (this.activeChainTeamName === teamName) {
      this.activeChainTeamName = undefined
    }
  }

  /**
   * Creates a new chain and adds it to the service
   * @param teamName Name of the team to create
   * @param username Name of the user to create
   * @param setActive Whether to set the chain as active
   * @returns The created chain
   */
  async createChain(teamName: string, username: string, setActive: boolean): Promise<SigChain> {
    if (this.chains.has(teamName)) {
      throw new Error(`Chain for team ${teamName} already exists`)
    }
    const sigChain = SigChain.create(teamName, username)
    this.addChain(sigChain, setActive, teamName)
    await this.saveChain(teamName)
    this.handleChainUpdate(teamName)
    return sigChain
  }

  async createChainFromInvite(
    username: string,
    teamName: string,
    seed: string,
    teamId: string | undefined,
    setActive: boolean
  ): Promise<SigChain> {
    this.logger.info('Creating chain from invite')
    const sigChain = SigChain.createFromInvite(username, seed)
    this.addChain(sigChain, setActive, teamName, teamId)
    await this.saveChain(teamName)
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
    this.addChain(sigChain, setActive)
    return sigChain
  }

  /* LevelDB methods */

  /**
   * Loads a chain from disk and adds it to the service
   * @param teamName Name of the team to load
   * @param setActive Whether to set the chain as active
   * @returns The SigChain instance loaded from disk
   * @throws Error if the chain doesn't exist
   */
  async loadChain(teamName: string, setActive: boolean): Promise<SigChain> {
    await this._ensureDb()
    this.logger.info(`Loading chain for team ${teamName}`)
    const chainData = await this.localDbService.getSigChain(teamName)
    if (!chainData) {
      throw new Error(`Chain for team ${teamName} not found`)
    }
    if (!chainData.serializedTeam) {
      throw new Error(`Chain for team ${teamName} is missing serialized team`)
    }
    if (!chainData.teamKeyRing) {
      throw new Error(`Chain for team ${teamName} is missing keyring`)
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
  async saveChain(teamName: string): Promise<void> {
    this.logger.info(`Saving chain to disk`, teamName)
    await this._ensureDb()
    const chain = this.getChain({ teamName })
    await this.localDbService.setSigChain(chain, teamName)
  }

  private async _ensureDb(): Promise<void> {
    if (this.localDbService.getStatus() !== 'open') {
      this.logger.warn(`LocalDbService wasn't open, opening now!`)
      await this.localDbService.open()
    }
  }
}
