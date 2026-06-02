/**
 * Handles role-related chain operations
 */

import { SigChain } from '../../sigchain'
import { ChainServiceBase } from '../chainServiceBase'
import { Member } from '@localfirst/auth'
import { createLogger } from '../../../common/logger'
import { hash } from '@localfirst/crypto'
import { defaultChannelPermissions } from './permissions'

const logger = createLogger('auth:channelService')

class ChannelService extends ChainServiceBase {
  constructor(sigChain: SigChain) {
    super(sigChain)
  }

  public create(channelId: string): string {
    const roleName = this.generateChannelRoleName(channelId)
    logger.info(`Adding new channel role with name ${roleName}`)
    this.sigChain.roles.create(roleName, defaultChannelPermissions())
    return roleName
  }

  public createWithMembers(channelId: string, memberIdsForChannel: string[]): string {
    const roleName = this.create(channelId)
    for (const memberId of memberIdsForChannel) {
      this.addMember(memberId, channelId)
    }
    return roleName
  }

  public addMember(memberId: string, channelId: string) {
    logger.info(`Adding member with ID ${memberId} to channel ${channelId}`)
    const roleName = this.generateChannelRoleName(channelId)
    this.sigChain.roles!.addMember(memberId, roleName)
  }

  public memberInChannel(memberId: string, channelId: string): boolean {
    const roleName = this.generateChannelRoleName(channelId)
    return this.sigChain.roles.memberHasRole(memberId, roleName)
  }

  public amIMemberOfChannel(channelId: string): boolean {
    const roleName = this.generateChannelRoleName(channelId)
    return this.sigChain.roles.amIMemberOfRole(roleName)
  }

  public getMembersInChannel(channelId: string): Member[] {
    const roleName = this.generateChannelRoleName(channelId)
    return this.sigChain.roles.getMembersForRole(roleName)
  }

  public revokeMembership(memberId: string, channelId: string) {
    logger.info(`Revoking membership of channel ${channelId} for member with ID ${memberId}`)
    const roleName = this.generateChannelRoleName(channelId)
    this.sigChain.roles.revokeMembership(memberId, roleName)
  }

  public delete(channelId: string) {
    logger.info(`Removing role for channel ${channelId}`)
    const roleName = this.generateChannelRoleName(channelId)
    this.sigChain.roles.delete(roleName)
  }

  public generateChannelRoleName(channelId: string): string {
    return hash(this.sigChain.team!.id, `private_channel_${channelId}`)
  }
}

export { ChannelService }
