/**
 * Handles generating the chain and aggregating all chain operations
 */

import * as auth from '../../../../../3rd-party/auth/packages/auth/dist'
import { UserService } from './services/members/user.service'
import { RoleService } from './services/roles/role.service'
import { DeviceService } from './services/members/device.service'
import { InviteService } from './services/invites/invite.service'
import { CryptoService } from './services/crypto/crypto.service'
import { ServerService } from './services/members/server.service'
import { RoleName, SELF_ASSIGN_ROLES } from './services/roles/roles'
import { createLogger } from '../common/logger'
import EventEmitter from 'events'
import { LockboxService } from './services/crypto/lockbox.service'
import { ChannelService } from './services/roles/channel.service'
import { LFAEvents, PendingDeviceAdmission, RANDOM_TEAM_NAME_LENGTH, SigchainEvents } from './types'
import { randomKey } from '@localfirst/crypto'
import type {
  CreateDeviceFromInviteSeedInput,
  CreateUserFromInviteSeedInput,
  CreateUserInput,
} from './services/members/types'

const logger = createLogger('auth:sigchain')
const lfaLogger = createLogger('localfirst')

class SigChain extends EventEmitter {
  private _context: auth.MemberContext | auth.InviteeContext
  private _pendingDeviceAdmission: PendingDeviceAdmission | undefined
  private _users: UserService | null = null
  private _devices: DeviceService | null = null
  private _roles: RoleService | null = null
  private _channels: ChannelService | null = null
  private _invites: InviteService | null = null
  private _crypto: CryptoService | null = null
  private _server: ServerService | null = null
  private _lockbox: LockboxService | null = null

  private constructor(
    context: auth.MemberContext | auth.InviteeContext,
    pendingDeviceAdmission?: PendingDeviceAdmission
  ) {
    super()
    this._pendingDeviceAdmission = pendingDeviceAdmission
    this.context = context
    this.initServices()
  }

  get team(): auth.Team | null {
    if ('team' in this.context) {
      return this.context.team
    }
    return null
  }

  get context(): auth.MemberContext | auth.InviteeContext {
    return this._context
  }

  set context(context: auth.MemberContext | auth.InviteeContext) {
    logger.warn('Setting context', Object.keys(context))

    const oldContext = this._context
    const newTeam = 'team' in context ? context.team : null
    const oldTeam = oldContext && 'team' in oldContext ? oldContext.team : null

    if (oldTeam) {
      logger.info('Detaching socket listeners')
      oldTeam.removeListener(LFAEvents.UPDATED, this.handleTeamUpdate)
    }
    if (newTeam) {
      logger.info('Attaching socket listeners')
      newTeam.on(LFAEvents.UPDATED, this.handleTeamUpdate)
    }

    this._context = context
  }

  get teamId(): string | undefined {
    return this.team?.id
  }

  get teamName(): string | undefined {
    return this.team?.teamName
  }

  get user(): auth.UserWithSecrets {
    if (!('user' in this.context)) {
      throw new Error('User is unavailable until the invited device is admitted')
    }
    return this.context.user
  }

  get userId(): string {
    if ('user' in this.context) {
      return this.context.user.userId
    }
    if (this._pendingDeviceAdmission == null) {
      throw new Error('User ID is unavailable until the invited device is admitted')
    }
    return this._pendingDeviceAdmission.userId
  }

  get username(): string {
    return 'user' in this.context ? this.context.user.userName : this.context.userName
  }

  get device(): auth.DeviceWithSecrets | auth.FirstUseDeviceWithSecrets {
    return this.context.device
  }

  get isPendingDeviceAdmission(): boolean {
    return 'invitationSeed' in this.context && !('user' in this.context)
  }

  private handleTeamUpdate = async (payload: { head: auth.Hash[] }) => {
    this.emit(SigchainEvents.UPDATED, payload)
  }

  /**
   * Create a brand new SigChain with a given name and also generate the initial user with an optional name/ID
   *
   * @param createUserInput Optional input to user creation
   * @returns LoadedSigChain instance with the new SigChain and user context
   */
  public static create(createUserInput: CreateUserInput = {}): SigChain {
    const localUser = UserService.create(createUserInput)
    const team: auth.Team = auth.createTeam(
      SigChain.generateRandomTeamName(),
      localUser,
      undefined,
      { selfAssignableRoles: SELF_ASSIGN_ROLES },
      lfaLogger
    )
    const adminContext = {
      user: localUser.user,
      device: localUser.device,
      team: team,
    } as auth.MemberContext
    const sigChain = new SigChain(adminContext)

    // Initialize member role (your own user is added by default to the role)
    sigChain.roles.create(RoleName.MEMBER)

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
    const team: auth.Team = auth.loadTeam(serializedTeam, context, teamKeyRing, lfaLogger)
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
   * @param input Create user input with invite seed
   * @returns LoadedSigChain instance with the given user context
   */
  public static createFromInvite(input: CreateUserFromInviteSeedInput): SigChain {
    const { seed } = input
    const prospectiveUser = UserService.createFromInviteSeed(input)
    const context = {
      user: prospectiveUser.context.user,
      device: prospectiveUser.context.device,
      invitationSeed: seed,
    } as auth.InviteeMemberContext
    return new SigChain(context)
  }

  public static createFromDeviceInvite(input: CreateDeviceFromInviteSeedInput): SigChain {
    const { seed, userName, deviceName, expectedTeamId, expectedUserId } = input
    const context = {
      device: DeviceService.generateFirstUseDevice(deviceName),
      invitationSeed: seed,
      userName,
    } satisfies auth.InviteeDeviceContext
    return new SigChain(context, { teamId: expectedTeamId, userId: expectedUserId })
  }

  public completeInvitation(team: auth.Team, user: auth.UserWithSecrets): void {
    if ('team' in this.context) {
      return
    }

    if (!('user' in this.context)) {
      const expected = this._pendingDeviceAdmission
      if (expected == null) {
        throw new Error('Device admission expectations are missing')
      }
      if (team.id !== expected.teamId) {
        throw new Error(`Device admission team mismatch: ${team.id} !== ${expected.teamId}`)
      }
      if (user.userId !== expected.userId) {
        throw new Error(`Device admission user mismatch: ${user.userId} !== ${expected.userId}`)
      }
      if (!team.hasDevice(this.context.device.deviceId)) {
        throw new Error(`Admitted team does not contain device ${this.context.device.deviceId}`)
      }

      this.context = {
        device: { ...this.context.device, userId: user.userId },
        team,
        user,
      }
      this._pendingDeviceAdmission = undefined
      return
    }

    this.context = {
      device: this.context.device,
      team,
      user,
    }
  }

  private initServices() {
    this._users = new UserService(this)
    this._devices = new DeviceService(this)
    this._roles = new RoleService(this)
    this._channels = new ChannelService(this)
    this._invites = new InviteService(this)
    this._crypto = new CryptoService(this)
    this._server = new ServerService(this)
    this._lockbox = new LockboxService(this)
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

  get channels(): ChannelService {
    return this._channels!
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

  get lockbox(): LockboxService {
    return this._lockbox!
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
    const team: auth.Team = this.lfa.loadTeam(serializedTeam, context, teamKeyRing, lfaLogger)
    team.join(teamKeyRing)
    const memberContext = {
      user: context.user,
      device: context.device,
      team: team,
    } as auth.MemberContext
    return new SigChain(memberContext)
  }

  public static generateRandomTeamName(): string {
    return randomKey(RANDOM_TEAM_NAME_LENGTH)
  }
}

export { SigChain }
