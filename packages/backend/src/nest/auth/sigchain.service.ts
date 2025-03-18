import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { SigChain } from './sigchain'
import { InviteeMemberContext, Keyring, LocalUserContext, MemberContext, Team } from '3rd-party/auth/packages/auth/dist'
import { LocalDbService } from '../local-db/local-db.service'
import { createLogger } from '../common/logger'
import { SocketService } from '../socket/socket.service'
import { SocketActionTypes } from '@quiet/types'
import { type RoleService } from './services/roles/role.service'
import { type ChannelService } from './services/roles/channel.service'
import { type DeviceService } from './services/members/device.service'
import { type InviteService } from './services/invites/invite.service'
import { type UserService } from './services/members/user.service'
import { type CryptoService } from './services/crypto/crypto.service'
import { type UserWithSecrets } from '@localfirst/auth'
import { type DeviceWithSecrets } from '@localfirst/auth'
import { SERVER_IO_PROVIDER } from '../const'
import { ServerIoProviderTypes } from '../types'

@Injectable()
export class SigChainService {
  public activeChainTeamName: string | undefined
  private readonly logger = createLogger(SigChainService.name)
  private chains: Map<string, SigChain> = new Map()

  constructor(
    @Inject(SERVER_IO_PROVIDER) public readonly serverIoProvider: ServerIoProviderTypes,
    private readonly localDbService: LocalDbService,
    private readonly socketService: SocketService
  ) {}

  get activeChain(): SigChain {
    return this.getActiveChain()
  }

  get users(): UserService {
    return this.getActiveChain().users
  }

  get roles(): RoleService {
    return this.getActiveChain().roles
  }

  get channels(): ChannelService {
    return this.getActiveChain().channels
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

  getActiveChain(): SigChain {
    if (!this.activeChainTeamName) {
      throw new Error('No active chain found!')
    }
    return this.getChain(this.activeChainTeamName)
  }

  /**
   * Gets a chain by team name
   * @param teamName Name of the team to get the chain for
   * @returns The chain for the team
   * @throws Error if the chain doesn't exist
   */
  getChain(teamName: string): SigChain {
    if (!this.chains.has(teamName)) {
      throw new Error(`No chain found for team ${teamName}`)
    }
    return this.chains.get(teamName)!
  }

  setActiveChain(teamName: string): void {
    if (this.activeChainTeamName && this.activeChainTeamName !== teamName) {
      this.detachSocketListeners(this.getChain(this.activeChainTeamName))
    }
    if (!this.chains.has(teamName)) {
      throw new Error(`No chain found for team ${teamName}, can't set to active!`)
    }
    this.activeChainTeamName = teamName
    this.attachSocketListeners(this.getChain(teamName))
    this.socketService.emit(SocketActionTypes.SET_MY_USER_ID, this.getActiveChain().user.userId)
  }

  private handleChainUpdate() {
    this.socketService.emit(SocketActionTypes.USERS_UPDATED, this.getActiveChain().team?.members())
  }

  private attachSocketListeners(chain: SigChain): void {
    chain.on('updated', this.handleChainUpdate)
  }

  private detachSocketListeners(chain: SigChain): void {
    chain.removeListener('updated', this.handleChainUpdate)
  }

  /**
   * Adds a chain to the service
   * @param chain SigChain to add
   * @param setActive Whether to set the chain as active
   * @returns Whether the chain was set as active
   */
  addChain(chain: SigChain, setActive: boolean, teamName?: string): boolean {
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
    return sigChain
  }

  async createChainFromInvite(username: string, teamName: string, seed: string, setActive: boolean): Promise<SigChain> {
    this.logger.info('Creating chain from invite')
    const sigChain = SigChain.createFromInvite(username, seed)
    this.addChain(sigChain, setActive, teamName)
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
    const chain = this.getChain(teamName)
    await this.localDbService.setSigChain(chain, teamName)
  }

  private async _ensureDb(): Promise<void> {
    if (this.localDbService.getStatus() !== 'open') {
      this.logger.warn(`LocalDbService wasn't open, opening now!`)
      await this.localDbService.open()
    }
  }
}
