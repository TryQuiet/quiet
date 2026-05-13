import { Injectable } from '@nestjs/common'
import EventEmitter from 'events'

import { ChannelMessage, CompoundError, ConsumedChannelMessage, MessageType } from '@quiet/types'

import { createLogger } from '../../../common/logger'
import { EncryptionScopeType } from '../../../auth/services/crypto/types'
import { SigChainService } from '../../../auth/sigchain.service'
import { EncryptableMessageComponents, EncryptedMessage } from './messages.types'
import { RoleName } from '../../../auth/services/roles/roles'
import { isConsumedChannelMessage, isEncryptedMessage, isMessage } from '../../../validation/validators'
import { BaseMessagesService } from './base-messages.service'

@Injectable()
export class PublicChannelMessagesService extends BaseMessagesService {
  protected readonly logger = createLogger(`storage:channels:publicChannelsMessagesService`)

  constructor(protected readonly sigChainService: SigChainService) {
    super(sigChainService)
  }

  /**
   * Handle processing of message to be added to OrbitDB and sent to peers
   *
   * @param message Message to send
   * @returns Processed message
   */
  public async onSend(message: ChannelMessage): Promise<EncryptedMessage> {
    return this._encryptPublicChannelMessage(message)
  }

  /**
   * Handle processing of message consumed from OrbitDB
   *
   * @param message Message consumed from OrbitDB
   * @returns Processed message if decryptable, undefined if undecryptable and false if intentionally skip decryption
   */
  public async onConsume(message: EncryptedMessage): Promise<ConsumedChannelMessage | undefined | false> {
    try {
      const decryptedMessage = this._decryptPublicChannelMessage(message)
      if (!this.validateMessage(decryptedMessage, message)) {
        return
      }
      return decryptedMessage
    } catch (e) {
      this.logger.error(`Failed to process message on consume`, e)
      return
    }
  }

  private _encryptPublicChannelMessage(rawMessage: ChannelMessage): EncryptedMessage {
    try {
      const chain = this.sigChainService.getActiveChain()
      const encryptable: EncryptableMessageComponents = {
        id: rawMessage.id,
        userId: chain.user.userId,
        type: rawMessage.type,
        channelId: rawMessage.channelId,
        message: rawMessage.message,
        media: rawMessage.media,
      }
      const encryptedMessage = chain.crypto.encryptAndSign(encryptable, {
        type: EncryptionScopeType.ROLE,
        name: RoleName.MEMBER,
      })
      return {
        id: rawMessage.id,
        channelId: rawMessage.channelId,
        createdAt: rawMessage.createdAt,
        teamId: encryptedMessage.teamId,
        encSignature: encryptedMessage.signature,
        contents: encryptedMessage.encrypted,
      }
    } catch (e) {
      throw new CompoundError(`Failed to encrypt message with error`, e)
    }
  }

  private _decryptPublicChannelMessage(encryptedMessage: EncryptedMessage): ConsumedChannelMessage {
    try {
      const chain = this.sigChainService.getActiveChain()
      this.logger.warn('Encrypted message', encryptedMessage)
      const decryptedMessage = chain.crypto.decryptAndVerify<EncryptableMessageComponents>(
        encryptedMessage.contents,
        encryptedMessage.encSignature,
        true
      )
      return {
        ...decryptedMessage.contents,
        userId: decryptedMessage.contents.userId,
        createdAt: encryptedMessage.createdAt,
        encSignature: encryptedMessage.encSignature,
        verified: decryptedMessage.isValid,
      }
    } catch (e) {
      throw new CompoundError(`Failed to decrypt message with error`, e)
    }
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
