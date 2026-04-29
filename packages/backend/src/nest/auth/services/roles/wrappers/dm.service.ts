/**
 * Handles role-related for private DMs chain operations
 */

import { hash } from '@localfirst/crypto'

import { SigChain } from '../../../sigchain'
import { ChainServiceBase } from '../../chainServiceBase'
import { createLogger } from '../../../../common/logger'
import { defaultDmPermissions } from '../permissions'

const logger = createLogger('auth:dmService')

class DMService extends ChainServiceBase {
  constructor(sigChain: SigChain) {
    super(sigChain)
  }

  public createWithMembers(memberIds: string[]): string {
    const membersWithMe = [...memberIds, this.sigChain.context.user.userId]
    const roleName = this.generateDmRoleName(membersWithMe)
    logger.info(`Adding new group DM role with name ${roleName}`)
    this.sigChain.roles.createWithMembers(roleName, memberIds, defaultDmPermissions(memberIds))
    return roleName
  }

  public delete(memberIds: string[]) {
    logger.info(`Removing role for DM with members`, memberIds)
    const roleName = this.generateDmRoleName(memberIds)
    this.sigChain.roles.delete(roleName)
  }

  public generateDmRoleName(memberIds: string[]): string {
    return hash(this.sigChain.team!.id, `private_dm_${memberIds.sort()}`)
  }
}

export { DMService }
