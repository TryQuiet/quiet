import EventEmitter from 'events'

import { ChannelMessage, CompoundError, ConsumedChannelMessage, MessageType } from '@quiet/types'

import { createLogger } from '../../../common/logger'
import { EncryptionScopeType } from '../../../auth/services/crypto/types'
import { SigChainService } from '../../../auth/sigchain.service'
import { EncryptableMessageComponents, EncryptedMessage } from './messages.types'
import { RoleName } from '../../../auth/services/roles/roles'
import { isConsumedChannelMessage, isEncryptedMessage, isMessage } from '../../../validation/validators'
import { NotImplementedException } from '@nestjs/common'

export class BaseMessagesService extends EventEmitter {
  protected readonly logger = createLogger(`storage:channels:messagesService`)

  constructor(protected readonly sigChainService: SigChainService) {
    super()
  }

  /**
   * Handle processing of message to be added to OrbitDB and sent to peers
   *
   * @param message Message to send
   * @returns Processed message
   */
  public async onSend(message: ChannelMessage, roleName?: string): Promise<EncryptedMessage> {
    throw new NotImplementedException('onSend is not implemented')
  }

  /**
   * Handle processing of message consumed from OrbitDB
   *
   * @param message Message consumed from OrbitDB
   * @returns Processed message if decryptable, undefined if undecryptable and false if intentionally skip decryption
   */
  public async onConsume(message: EncryptedMessage): Promise<ConsumedChannelMessage | false | undefined> {
    throw new NotImplementedException('onSend is not implemented')
  }

  /**
   * Validates a decrypted message for critical immutable properties.
   * Only properties which can not eventually change should be validated here.
   * This is to ensure that the message has not been tampered with
   * and that it matches the encrypted message it was decrypted from.
   * Failing messages should be discarded.
   *
   * @param message Message to validate
   * @param encryptedMessage Encrypted message to validate against
   * @returns True if the message is valid, false otherwise
   */
  public validateMessage(message: ConsumedChannelMessage, encryptedMessage: EncryptedMessage): boolean {
    if (message.id !== encryptedMessage.id) {
      this.logger.warn(`Cannot validate msg ${message.id}: IDs do not match`)
      return false
    }
    if (!isConsumedChannelMessage(message)) {
      this.logger.warn(`Cannot validate msg ${message.id}: message shape is not valid`)
      return false
    }
    if (!isEncryptedMessage(encryptedMessage)) {
      this.logger.warn(`Cannot validate msg ${message.id}: encrypted message shape is not valid`)
      return false
    }
    return true
  }
}
