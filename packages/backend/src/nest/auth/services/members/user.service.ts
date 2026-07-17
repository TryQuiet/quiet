/**
 * Handles user-related chain operations
 */
import { ChainServiceBase } from '../chainServiceBase'
import {
  ProspectiveUser,
  MemberSearchOptions,
  DEFAULT_SEARCH_OPTIONS,
  type CreateUserInput,
  type CreateUserFromInviteSeedInput,
  RANDOM_USERNAME_LENGTH,
} from './types'
import { DeviceWithSecrets, LocalUserContext, Member, User, UserWithSecrets } from '@localfirst/auth'
import { SigChain } from '../../sigchain'
import { DeviceService } from './device.service'
import { InviteService } from '../invites/invite.service'
import { KeyMap } from '@localfirst/auth/team/selectors/keyMap'
import { createLogger } from '../../../common/logger'
import { randomKey } from '@localfirst/crypto'

const logger = createLogger('auth:userService')

class UserService extends ChainServiceBase {
  constructor(sigChain: SigChain) {
    super(sigChain)
  }
  /**
   * Generates a brand new QuietUser instance with an initial device
   *
   * @param input Optional input to set a custom username/user ID
   * @returns New QuietUser instance with an initial device
   */
  public static create(input: CreateUserInput = {}): LocalUserContext {
    let name = input.name
    const id = input.id
    if (name == null) {
      name = UserService.generateArbitraryUsername()
    }
    const user: UserWithSecrets = SigChain.lfa.createUser(name, id)
    const device: DeviceWithSecrets = DeviceService.generateDeviceForUser(user.userId)

    return {
      user,
      device,
    }
  }

  /**
   * Generates a new prospective user from an invite seed
   *
   * @param input Input to create a user with the invite seed from the community owne and an optional username/user ID
   * @returns ProspectiveUser instance
   */
  public static createFromInviteSeed(input: CreateUserFromInviteSeedInput): ProspectiveUser {
    const { name, seed } = input
    const context = this.create({ name })
    const inviteProof = InviteService.generateProof(seed)
    const publicKeys = UserService.redactUser(context.user).keys

    return {
      context,
      inviteProof,
      publicKeys,
    }
  }

  public getKeys(): KeyMap {
    return this.sigChain.team!.allKeys()
  }

  public getAllUsers(): Member[] {
    return this.sigChain.team!.members()
  }

  public getUsersById(memberIds: string[], options: MemberSearchOptions = DEFAULT_SEARCH_OPTIONS): Member[] {
    if (memberIds.length === 0) {
      return []
    }

    return this.sigChain.team!.members(memberIds, options)
  }

  public getUserById(memberId: string, options: MemberSearchOptions = DEFAULT_SEARCH_OPTIONS): Member | undefined {
    const users = this.getUsersById([memberId], options)
    if (users.length === 0) {
      if (options.throwOnMissing) {
        throw new Error(`No user found for ID ${memberId}`)
      }
    }
    if (users.length > 1) {
      throw new Error(`Expected 1 user for ID but found ${users.length} user records`)
    }
    return users[0]
  }

  public static redactUser(user: UserWithSecrets): User {
    return SigChain.lfa.redactUser(user)
  }

  /**
   * Generate a random arbitrary base58 username to store on the chain
   *
   * @returns Random base58 string
   */
  public static generateArbitraryUsername(): string {
    return randomKey(RANDOM_USERNAME_LENGTH)
  }
}

export { UserService }
