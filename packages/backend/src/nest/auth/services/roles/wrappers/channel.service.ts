/**
 * Handles role-related chain operations
 */

import { SigChain } from '../../../sigchain'
import { ChainServiceBase } from '../../chainServiceBase'
import { Member } from '@localfirst/auth'
import { createLogger } from '../../../../common/logger'
import { randomKey } from '@localfirst/crypto'
import { DEFAULT_CHANNEL_ROLE_NAME_LENGTH, PUBLIC_CHANNEL_MODIFICATION_ROLES } from '../roles'
import { defaultChannelPermissions } from '../permissions'

const logger = createLogger('auth:channelService')

class ChannelService extends ChainServiceBase {
  constructor(sigChain: SigChain) {
    super(sigChain)
  }

  public create(): string {
    const roleName = this.generateChannelRoleName()
    logger.info(`Adding new channel role with name ${roleName}`)
    this.sigChain.roles.create(roleName, defaultChannelPermissions())
    return roleName
  }

  public createWithMembers(memberIdsForChannel: string[]): string {
    const roleName = this.create()
    for (const memberId of memberIdsForChannel) {
      this.addMember(memberId, roleName)
    }
    return roleName
  }

  public addMember(memberId: string, channelRoleName: string) {
    logger.info(`Adding member to channel with role ${channelRoleName}`)
    this.sigChain.roles!.addMember(memberId, channelRoleName)
  }

  public memberInChannel(memberId: string, channelRoleName: string): boolean {
    return this.sigChain.roles.memberHasRole(memberId, channelRoleName)
  }

  public amIMemberOfChannel(channelRoleName: string): boolean {
    return this.sigChain.roles.amIMemberOfRole(channelRoleName)
  }

  public getMembersInChannel(channelRoleName: string): Member[] {
    return this.sigChain.roles.getMembersForRole(channelRoleName)
  }

  public revokeMembership(memberId: string, channelRoleName: string) {
    logger.info(`Revoking membership of channel with role ${channelRoleName}`)
    this.sigChain.roles.revokeMembership(memberId, channelRoleName)
  }

  public delete(channelRoleName: string) {
    logger.info(`Removing role for channel`)
    this.sigChain.roles.delete(channelRoleName)
  }

  public canMemberCreatePublicChannel(memberId: string): boolean {
    for (const allowedRoleName of PUBLIC_CHANNEL_MODIFICATION_ROLES) {
      if (this.sigChain.roles.memberHasRole(memberId, allowedRoleName)) {
        return true
      }
    }
    return false
  }

  public canICreatePublicChannel(): boolean {
    return this.canMemberCreatePublicChannel(this.sigChain.user.userId)
  }

  public canMemberDeletePublicChannel(memberId: string): boolean {
    for (const allowedRoleName of PUBLIC_CHANNEL_MODIFICATION_ROLES) {
      if (this.sigChain.roles.memberHasRole(memberId, allowedRoleName)) {
        return true
      }
    }
    return false
  }

  public canIDeletePublicChannel(): boolean {
    return this.canMemberCreatePublicChannel(this.sigChain.user.userId)
  }

  public canMemberCreatePrivateChannel(memberId: string): boolean {
    return this.sigChain.roles.canMemberCreateRole(memberId)
  }

  public canICreatePrivateChannel(): boolean {
    return this.canMemberCreatePrivateChannel(this.sigChain.user.userId)
  }

  public canMemberAddMembersToPrivateChannel(memberId: string, channelRoleName: string): boolean {
    return this.sigChain.roles.canMemberAddMembersRole(memberId, channelRoleName)
  }

  public canIAddMembersToPrivateChannel(channelRoleName: string): boolean {
    return this.canMemberAddMembersToPrivateChannel(this.sigChain.user.userId, channelRoleName)
  }

  public canMemberRemoveMembersFromPrivateChannel(memberId: string, channelRoleName: string): boolean {
    return this.sigChain.roles.canMemberRemoveMembersFromRole(memberId, channelRoleName)
  }

  public canIRemoveMembersFromPrivateChannel(channelRoleName: string): boolean {
    return this.canMemberRemoveMembersFromPrivateChannel(this.sigChain.user.userId, channelRoleName)
  }

  public canMemberDeletePrivateChannel(memberId: string, channelRoleName: string): boolean {
    return this.sigChain.roles.canMemberDeleteRole(memberId, channelRoleName)
  }

  public canIDeletePrivateChannel(channelRoleName: string): boolean {
    return this.canMemberDeletePrivateChannel(this.sigChain.user.userId, channelRoleName)
  }

  public generateChannelRoleName(roleNameLength: number = DEFAULT_CHANNEL_ROLE_NAME_LENGTH): string {
    return randomKey(roleNameLength)
  }
}

export { ChannelService }
