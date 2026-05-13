/**
 * OrbitDB access controller for public channels
 */

import { type LogEntry, type IdentitiesType, type CanAppendFunc } from '@orbitdb/core'
import { NoCryptoEngineError } from '@quiet/types'
import { EncryptedMessage } from '../messages.types'
import { AccessControllerConfig, BaseMessagesAccessController } from './BaseMessageAccessController'
import { SigChainService } from '../../../../auth/sigchain.service'
import { Injectable } from '@nestjs/common'

const TYPE = 'messagesaccess'

@Injectable()
export class MessagesAccessController extends BaseMessagesAccessController<AccessControllerConfig> {
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
        if (!(await identities.verifyIdentity(writerIdentity))) {
          return false
        }
      } else {
        return false
      }

      return true
    }
  }
}
