/**
 * Handles channel-related chain operations
 */

import { MemberContext, Role } from '@localfirst/auth'
import { SigChain } from '../../sigchain'
import { ChainServiceBase } from '../chainServiceBase'
import { Channel, QuietRole } from './roles'
import { createLogger } from '../../../common/logger'

const logger = createLogger('auth:channelService')

const CHANNEL_ROLE_KEY_PREFIX = 'priv_chan_'

class ChannelService extends ChainServiceBase {
  constructor(sigChain: SigChain) {
    super(sigChain)
  }

  // TODO: figure out permissions
  public createPrivateChannel(channelName: string): Channel {
    logger.info(`Creating private channel role with name ${channelName}`)
    this.sigChain.roles.create(ChannelService.getPrivateChannelRoleName(channelName))
    this.addMemberToPrivateChannel(this.sigChain.user.userId, channelName)

    return this.getChannel(channelName)
  }

  public addMemberToPrivateChannel(userId: string, channelName: string) {
    logger.info(`Adding member with ID ${userId} to private channel role with name ${channelName}`)
    this.sigChain.roles.addMember(userId, ChannelService.getPrivateChannelRoleName(channelName))
  }

  public revokePrivateChannelMembership(userId: string, channelName: string) {
    logger.info(`Removing member with ID ${userId} from private channel with name ${channelName}`)
    this.sigChain.roles.revokeMembership(userId, ChannelService.getPrivateChannelRoleName(channelName))
  }

  public deletePrivateChannel(channelName: string) {
    logger.info(`Deleting private channel with name ${channelName}`)
    this.sigChain.roles.delete(ChannelService.getPrivateChannelRoleName(channelName))
  }

  public leaveChannel(channelName: string) {
    logger.info(`Leaving private channel with name ${channelName}`)
    this.revokePrivateChannelMembership(this.sigChain.user.userId, channelName)
  }

  public getChannel(channelName: string): Channel {
    const role = this.sigChain.roles.getRole(ChannelService.getPrivateChannelRoleName(channelName))
    return this.roleToChannel(role, channelName)
  }

  public getChannels(haveAccessOnly: boolean = false): Channel[] {
    const allRoles = this.sigChain.roles.getAllRoles(haveAccessOnly)
    const allChannels = allRoles
      .filter((role: QuietRole) => this.isRoleChannel(role.roleName))
      .map((role: QuietRole) =>
        this.roleToChannel(role, ChannelService.getPrivateChannelNameFromRoleName(role.roleName))
      )

    return allChannels
  }

  public memberInChannel(userId: string, channelName: string): boolean {
    const roleName = ChannelService.getPrivateChannelRoleName(channelName)
    return this.sigChain.roles.memberHasRole(userId, roleName)
  }

  public amIInChannel(channelName: string): boolean {
    return this.memberInChannel(this.sigChain.user.userId, channelName)
  }

  public isRoleChannel(roleName: string): boolean
  public isRoleChannel(role: QuietRole | Role): boolean
  public isRoleChannel(roleNameOrRole: string | QuietRole | Role): boolean {
    let roleName: string
    if (typeof roleNameOrRole === 'string') {
      roleName = roleNameOrRole
    } else {
      roleName = roleNameOrRole.roleName
    }

    return roleName.startsWith(CHANNEL_ROLE_KEY_PREFIX)
  }

  private roleToChannel(role: QuietRole, channelName: string): Channel {
    return {
      ...role,
      channelName,
    } as Channel
  }

  public static getPrivateChannelRoleName(channelName: string): string {
    return `${CHANNEL_ROLE_KEY_PREFIX}${channelName}`
  }

  public static getPrivateChannelNameFromRoleName(roleName: string): string {
    return roleName.split(CHANNEL_ROLE_KEY_PREFIX)[1]
  }
}

export { ChannelService }
