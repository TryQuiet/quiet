/**
 * OrbitDB access controller for private channels
 */

import { type LogEntry, type IdentitiesType, CanAppendFunc } from '@orbitdb/core'
import { NoCryptoEngineError } from '@quiet/types'
import { EncryptedMessage } from '../messages.types'
import { SigChainService } from '../../../../auth/sigchain.service'
import { AccessControllerConfig, BaseMessagesAccessController } from './BaseMessageAccessController'
import { Injectable } from '@nestjs/common'

const TYPE = 'privatemessagesaccess'

@Injectable()
export class PrivateMessagesAccessController extends BaseMessagesAccessController {
  constructor(protected sigchainService: SigChainService) {
    super(TYPE, sigchainService)
  }
  protected canAppend(config: AccessControllerConfig, identities: IdentitiesType): CanAppendFunc {
    return async (entry: LogEntry<EncryptedMessage>): Promise<boolean> => {
      if (!crypto) throw new NoCryptoEngineError()

      const writerIdentity = await identities.getIdentity(entry.identity)
      if (!writerIdentity) {
        return false
      }

      const { id } = writerIdentity
      if (config.write.includes(id) || config.write.includes('*')) {
        if (!identities.verifyIdentity(writerIdentity)) {
          return false
        }
      } else {
        return false
      }

      const sigchain = config.sigchainService.getChain({ teamId: entry.payload.value!.teamId })
      if (!sigchain.channels.memberInChannel(id, entry.payload.value!.channelId)) {
        this.logger.warn(
          `User is not a member of the channel, skipping log append`,
          id,
          entry.payload.value!.teamId,
          entry.payload.value!.channelId
        )
        return false
      }

      return true
    }
  }
}
