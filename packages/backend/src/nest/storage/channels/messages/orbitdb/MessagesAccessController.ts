/**
 * OrbitDB access controller for public channels
 */

import { type LogEntry, type IdentitiesType, type CanAppendFunc } from '@orbitdb/core'
import { getVerifiedEntryWriter } from '../../../orbitDb/identity/lfa/entry-writer'
import { NoCryptoEngineError } from '@quiet/types'
import { EncryptedMessage } from '../messages.types'
import { AccessControllerConfig, BaseMessagesAccessController } from './BaseMessageAccessController'
import { SigChainService } from '../../../../auth/sigchain.service'
import { Injectable } from '@nestjs/common'
import { isEncryptedMessage } from '../../../../validation/validators'
import { EncryptionScopeType } from '../../../../auth/services/crypto/types'
import { RoleName } from '../../../../auth/services/roles/roles'

const TYPE = 'messagesaccess'

export interface PublicMessagesAccessControllerConfig extends AccessControllerConfig {
  channelId?: string
  teamId?: string
}

@Injectable()
export class MessagesAccessController extends BaseMessagesAccessController<PublicMessagesAccessControllerConfig> {
  constructor(protected sigchainService: SigChainService) {
    super(TYPE, sigchainService)
  }
  protected canAppend(config: PublicMessagesAccessControllerConfig, identities: IdentitiesType): CanAppendFunc {
    return async (entry: LogEntry<EncryptedMessage>): Promise<boolean> => {
      if (!crypto) throw new NoCryptoEngineError()

      const writerIdentity = await getVerifiedEntryWriter(identities, entry)
      if (writerIdentity == null) {
        return false
      }

      const { id } = writerIdentity
      if (!config.write.includes(id) && !config.write.includes('*')) {
        return false
      }

      if (entry.payload.value == null) {
        this.logger.error(`Can't verify OrbitDB entry ${entry.id}, payload value is nullish`)
        return false
      }

      if (!isEncryptedMessage(entry.payload.value)) {
        this.logger.warn(`Cannot validate msg ${entry.id}: encrypted message shape is not valid`)
        return false
      }

      const encryptedMessage = entry.payload.value
      if (
        config.teamId == null ||
        config.channelId == null ||
        id !== encryptedMessage.encSignature.author.name ||
        encryptedMessage.teamId !== config.teamId ||
        encryptedMessage.channelId !== config.channelId ||
        encryptedMessage.contents.scope.type !== EncryptionScopeType.ROLE ||
        encryptedMessage.contents.scope.name !== RoleName.MEMBER ||
        encryptedMessage.encSignature.author.type !== EncryptionScopeType.USER
      ) {
        this.logger.warn(`Message writer, author, team, channel, or encryption scope did not match`)
        return false
      }

      const sigchain = config.sigchainService.getChain(config.teamId, false)
      if (sigchain == null || !sigchain.roles.memberHasRole(id, RoleName.MEMBER)) {
        this.logger.warn(`Message writer is not an active member of the team`)
        return false
      }

      return true
    }
  }
}
