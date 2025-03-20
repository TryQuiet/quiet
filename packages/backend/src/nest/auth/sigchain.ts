/**
 * Handles generating the chain and aggregating all chain operations
 */

import * as auth from '@localfirst/auth'
import { UserService } from './services/members/user.service'
import { RoleService } from './services/roles/role.service'
import { DeviceService } from './services/members/device.service'
import { InviteService } from './services/invites/invite.service'
import { CryptoService } from './services/crypto/crypto.service'
import { ServerService } from './services/members/server.service'
import { RoleName } from './services/roles/roles'
import { createLogger } from '../common/logger'
import EventEmitter from 'events'

const logger = createLogger('auth:sigchain')

class SigChain extends EventEmitter {
  private _context: auth.MemberContext | auth.InviteeMemberContext
  private _users: UserService | null = null
  private _devices: DeviceService | null = null
  private _roles: RoleService | null = null
  private _invites: InviteService | null = null
  private _crypto: CryptoService | null = null
  private _server: ServerService | null = null

  private constructor(context: auth.MemberContext | auth.InviteeMemberContext) {
    super()
    this.context = context
    this.initServices()
  }

  get team(): auth.Team | null {
    if ('team' in this.context) {
      return this.context.team
    }
    return null
  }

  get context(): auth.MemberContext | auth.InviteeMemberContext {
    return this._context
  }

  set context(context: auth.MemberContext | auth.InviteeMemberContext) {
    logger.warn('Setting context', Object.keys(context))

    const oldContext = this._context
    const newTeam = 'team' in context ? context.team : null
    const oldTeam = oldContext && 'team' in oldContext ? oldContext.team : null

    if (oldTeam) {
      logger.info('Detaching socket listeners')
      oldTeam.removeListener('updated', this.handleTeamUpdate)
    }
    if (newTeam) {
      logger.info('Attaching socket listeners')
      newTeam.on('updated', this.handleTeamUpdate)
    }

    this._context = context
  }

  get user(): auth.UserWithSecrets {
    return this.context.user
  }

  get username(): string {
    return this.user!.userName
  }

  get device(): auth.DeviceWithSecrets {
    return this.context.device
  }

  private handleTeamUpdate = async (payload: { head: auth.Hash[] }) => {
    this.emit('updated', payload)
  }

  /**
   * Create a brand new SigChain with a given name and also generate the initial user with a given name
   *
   * @param teamName Name of the team we are creating
   * @param username Username of the initial user we are generating
   * @returns LoadedSigChain instance with the new SigChain and user context
   */
  public static create(teamName: string, username: string, userId?: string): SigChain {
    const localUser = UserService.create(username, userId)
    const team: auth.Team = auth.createTeam(teamName, localUser)
    const adminContext = {
      user: localUser.user,
      device: localUser.device,
      team: team,
    } as auth.MemberContext
    const sigChain = new SigChain(adminContext)

    // Initialize member role with yourself
    sigChain.roles.createWithMembers(RoleName.MEMBER, [localUser.user.userId])

    return sigChain
  }

  /**
   * Create a SigChain from a Team object and a LocalUserContext
   *
   * @param team Team to create the SigChain from
   * @param context LocalUserContext of the user
   * @returns LoadedSigChain instance with the given team and user context
   */
  public static createFromTeam(team: auth.Team, context: auth.LocalUserContext): SigChain {
    const memberContext = {
      user: context.user,
      device: context.device,
      team: team,
    } as auth.MemberContext
    return new SigChain(memberContext)
  }

  /**
   * Load a SigChain from a saved state
   *
   * @param serializedTeam Serialized team object to load
   * @param context LocalUserContext of the user
   * @param teamKeyRing Keyring of the team
   * @returns LoadedSigChain instance with the given team and user context
   */
  public static load(serializedTeam: Uint8Array, context: auth.LocalUserContext, teamKeyRing: auth.Keyring): SigChain {
    const team: auth.Team = auth.loadTeam(serializedTeam, context, teamKeyRing)
    const memberContext = {
      user: context.user,
      device: context.device,
      team: team,
    } as auth.MemberContext

    return new SigChain(memberContext)
  }

  /**
   * Create a SigChain from an invite seed
   *
   * @param username Username of the user to create
   * @param seed Seed of the invite
   * @returns LoadedSigChain instance with the given user context
   */
  public static createFromInvite(username: string, seed: string): SigChain {
    const prospectiveUser = UserService.createFromInviteSeed(username, seed)
    const context = {
      user: prospectiveUser.context.user,
      device: prospectiveUser.context.device,
      invitationSeed: seed,
    } as auth.InviteeMemberContext
    return new SigChain(context)
  }

  private initServices() {
    this._users = new UserService(this)
    this._devices = new DeviceService(this)
    this._roles = new RoleService(this)
    this._invites = new InviteService(this)
    this._crypto = new CryptoService(this)
    this._server = new ServerService(this)
  }

  public save(): Uint8Array {
    if (!this.team) {
      return new Uint8Array()
    }
    return this.team!.save() // this doesn't actually do anything but create the new state to save
  }

  get users(): UserService {
    return this._users!
  }

  get roles(): RoleService {
    return this._roles!
  }

  get devices(): DeviceService {
    return this._devices!
  }

  get invites(): InviteService {
    return this._invites!
  }

  get crypto(): CryptoService {
    return this._crypto!
  }

  get server(): ServerService {
    return this._server!
  }

  static get lfa(): typeof auth {
    return auth
  }

  /**
   * Join a team for testing purposes. Actual joining will be done through Connection handshakes
   */
  public static joinForTesting(
    context: auth.LocalUserContext,
    serializedTeam: Uint8Array,
    teamKeyRing: auth.Keyring
  ): SigChain {
    const team: auth.Team = this.lfa.loadTeam(serializedTeam, context, teamKeyRing)
    team.join(teamKeyRing)
    const memberContext = {
      user: context.user,
      device: context.device,
      team: team,
    } as auth.MemberContext
    return new SigChain(memberContext)
  }
}

export { SigChain }
