import EventEmitter from 'events'

import { ChannelMessage, ConsumedChannelMessage } from '@quiet/types'

import { createLogger } from '../../../common/logger'
import { SigChainService } from '../../../auth/sigchain.service'
import { EncryptedMessage, SHARED_FIELDS } from './messages.types'
import { isConsumedChannelMessage } from '../../../validation/validators'
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
  public async onSend(message: ChannelMessage): Promise<EncryptedMessage> {
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
   * @param decryptedMessage Message to validate
   * @param encryptedMessage Encrypted message to validate against
   * @returns True if the message is valid, false otherwise
   */
  public validateMessage(decryptedMessage: ConsumedChannelMessage, encryptedMessage: EncryptedMessage): boolean {
    if (decryptedMessage.id !== encryptedMessage.id) {
      this.logger.warn(`Cannot validate msg ${decryptedMessage.id}: IDs do not match`)
      return false
    }
    if (!isConsumedChannelMessage(decryptedMessage)) {
      this.logger.warn(`Cannot validate msg ${decryptedMessage.id}: message shape is not valid`)
      return false
    }
    // ensure that the fields we write to the message unencrypted match the ones inside the encrypted blob
    const mismatchedFields: typeof SHARED_FIELDS = []
    for (const sharedField of SHARED_FIELDS) {
      if (decryptedMessage[sharedField] !== encryptedMessage[sharedField]) {
        mismatchedFields.push(sharedField)
      }
    }
    if (mismatchedFields.length > 0) {
      this.logger.warn(
        `Fields on encrypted message and consumed (decrypted) message don't match.  Mismatched fields: `,
        mismatchedFields
      )
      return false
    }
    if (
      encryptedMessage.encSignature.author.name !== decryptedMessage.encSignature?.author.name ||
      encryptedMessage.encSignature.author.name !== decryptedMessage.userId
    ) {
      this.logger.warn(`User ID on the encryption signature didn't match the user ID on the message`)
      return false
    }
    return true
  }
}
