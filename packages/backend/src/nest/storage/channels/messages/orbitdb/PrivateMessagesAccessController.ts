/**
 * OrbitDB access controller for private channels
 */

import { type LogEntry, type IdentitiesType, CanAppendFunc } from '@orbitdb/core'
import { getVerifiedEntryWriter } from '../../../orbitDb/identity/lfa/entry-writer'
import { NoCryptoEngineError } from '@quiet/types'
import { EncryptedMessage } from '../messages.types'
import { SigChainService } from '../../../../auth/sigchain.service'
import { AccessControllerConfig, BaseMessagesAccessController } from './BaseMessageAccessController'
import { Injectable } from '@nestjs/common'
import { isEncryptedMessage } from '../../../../validation/validators'
import { EncryptionScopeType } from '../../../../auth/services/crypto/types'

const TYPE = 'privatemessagesaccess'

export interface PrivateAccessControllerConfig extends AccessControllerConfig {
  channelId: string
  teamId: string
  roleName: string
}

@Injectable()
export class PrivateMessagesAccessController extends BaseMessagesAccessController<PrivateAccessControllerConfig> {
  constructor(protected sigchainService: SigChainService) {
    super(TYPE, sigchainService)
  }

  protected canAppend(config: PrivateAccessControllerConfig, identities: IdentitiesType): CanAppendFunc {
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
      const writerMetadata = writerIdentity as typeof writerIdentity & { generation: number; teamId: string }

      if (entry.payload.value == null) {
        this.logger.error(`Can't verify OrbitDB entry ${entry.id}, payload value is nullish`)
        return false
      }

      if (!isEncryptedMessage(entry.payload.value)) {
        this.logger.warn(`Cannot validate msg ${entry.id}: encrypted message shape is not valid`)
        return false
      }

      if (entry.payload.value.teamId !== config.teamId) {
        this.logger.error(`Entry ${entry.payload.value.id} is from a different team`)
        return false
      }

      if (entry.payload.value.channelId !== config.channelId) {
        this.logger.error(`Entry ${entry.payload.value.id} is from a different channel`)
        return false
      }

      if (
        id !== entry.payload.value.encSignature.author.name ||
        writerMetadata.generation !== entry.payload.value.encSignature.author.generation ||
        writerMetadata.teamId !== config.teamId ||
        entry.payload.value.encSignature.author.type !== EncryptionScopeType.USER
      ) {
        this.logger.warn(`Message writer identity did not match the encrypted-signature author`)
        return false
      }

      const sigchain = config.sigchainService.getChain(config.teamId, false)
      if (sigchain == null) {
        this.logger.warn(`User is not a member of this team or team hasn't been initialized, sigchain was nullish`)
        return false
      }

      if (!sigchain.channels.memberInChannel(id, config.roleName)) {
        this.logger.warn(
          `User is not a member of the channel, skipping log append`,
          id,
          config.teamId,
          config.channelId
        )
        return false
      }

      if (
        entry.payload.value.contents.scope.type !== EncryptionScopeType.ROLE ||
        config.roleName !== entry.payload.value.contents.scope.name
      ) {
        this.logger.warn(`Message was encrypted to a different scope than the one configured on the channel`)
        return false
      }

      return true
    }
  }
}
