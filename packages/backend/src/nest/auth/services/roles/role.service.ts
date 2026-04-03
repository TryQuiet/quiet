/**
 * Handles role-related chain operations
 */

import { SigChain } from '../../sigchain'
import { ChainServiceBase } from '../chainServiceBase'
import { Permissions } from './permissions'
import { QuietRole, RoleName, SELF_ASSIGN_ROLES } from './roles'
import { AddRoleInput, Member, PermissionsMap, Role } from '@localfirst/auth'
import { createLogger } from '../../../common/logger'

const logger = createLogger('auth:roleService')

class RoleService extends ChainServiceBase {
  constructor(sigChain: SigChain) {
    super(sigChain)
  }

  // TODO: figure out permissions
  public create(roleName: RoleName | string, permissions: PermissionsMap = {}, staticMembership: boolean = false) {
    logger.info(`Adding new role with name ${roleName}`)
    if (!staticMembership) {
      permissions[Permissions.MODIFIABLE_MEMBERSHIP] = true
    }

    const input: AddRoleInput = {
      roleName,
      permissions,
      subRoles: [],
    }

    this.sigChain.team!.addRole(input)
  }

  // TODO: figure out permissions
  public createWithMembers(
    roleName: RoleName | string,
    memberIdsForRole: string[],
    permissions: PermissionsMap = {},
    staticMembership: boolean = false
  ) {
    this.create(roleName, permissions, staticMembership)
    for (const memberId of memberIdsForRole) {
      this.addMember(memberId, roleName)
    }
  }

  public addMember(memberId: string, roleName: RoleName | string) {
    logger.info(`Adding member with ID ${memberId} to role ${roleName}`)
    this.sigChain.team!.addMemberRole(memberId, roleName)
  }

  public addSelf(roleName: RoleName | string, seed: string, salt: string) {
    logger.info(`Adding role ${roleName} to self`)
    if (!SELF_ASSIGN_ROLES.includes(roleName)) {
      throw new Error(`Role ${roleName} cannot be self-assigned!`)
    }
    const inviteKeys = this.sigChain.lockbox.generateLockboxKeys(seed, salt)
    this.sigChain.team!.addMemberRoleToSelf(roleName, inviteKeys.keys)
  }

  public revokeMembership(memberId: string, roleName: RoleName | string) {
    logger.info(`Revoking role ${roleName} for member with ID ${memberId}`)
    this.sigChain.team!.removeMemberRole(memberId, roleName)
  }

  public delete(roleName: RoleName | string) {
    logger.info(`Removing role with name ${roleName}`)
    this.sigChain.team!.removeRole(roleName)
  }

  public getRole(roleName: RoleName | string): QuietRole {
    const role = this.sigChain.team!.roles(roleName)
    if (!role) {
      throw new Error(`No role found with name ${roleName}`)
    }

    return this.roleToQuietRole(role)
  }

  public getAllRoles(haveAccessOnly: boolean = false): QuietRole[] {
    const allRoles = this.sigChain.team!.roles().map(role => this.roleToQuietRole(role))
    if (haveAccessOnly) {
      return allRoles.filter((role: QuietRole) => role.hasRole === true)
    }

    return allRoles
  }

  public memberHasRole(memberId: string, roleName: RoleName | string): boolean {
    return this.sigChain.team!.memberHasRole(memberId, roleName)
  }

  public amIMemberOfRole(roleName: RoleName | string): boolean {
    return this.memberHasRole(this.sigChain.user.userId, roleName)
  }

  public getMembersForRole(roleName: RoleName | string): Member[] {
    return this.sigChain.team!.membersInRole(roleName)
  }

  private roleToQuietRole(role: Role): QuietRole {
    const members = this.sigChain.roles.getMembersForRole(role.roleName)
    const hasRole = this.sigChain.roles.amIMemberOfRole(role.roleName as RoleName)
    return {
      ...role,
      members,
      hasRole,
    }
  }
}

export { RoleService }
