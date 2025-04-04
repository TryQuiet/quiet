import { Injectable } from '@nestjs/common'
import EventEmitter from 'events'

import { ChannelMessage, CompoundError, ConsumedChannelMessage, MessageType } from '@quiet/types'

import { createLogger } from '../../../common/logger'
import { EncryptionScopeType } from '../../../auth/services/crypto/types'
import { SigChainService } from '../../../auth/sigchain.service'
import { EncryptableMessageComponents, EncryptedMessage } from './messages.types'
import { RoleName } from '../../../auth/services/roles/roles'

@Injectable()
export class MessagesService extends EventEmitter {
  private readonly logger = createLogger(`storage:channels:messagesService`)

  constructor(private readonly sigChainService: SigChainService) {
    super()
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
   * @returns Processed message
   */
  public async onConsume(message: EncryptedMessage): Promise<ConsumedChannelMessage | undefined> {
    try {
      return this._decryptPublicChannelMessage(message)
    } catch (e) {
      this.logger.error(`Failed to process message on consume`, e)
      return undefined
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
      const decryptedMessage = chain.crypto.decryptAndVerify<EncryptableMessageComponents>(
        encryptedMessage.contents,
        encryptedMessage.encSignature,
        false
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

  public validateMessage(message: ChannelMessage, encryptedMessage: EncryptedMessage): boolean {
    if (message.id !== encryptedMessage.id) {
      this.logger.info(`Message ID mismatch`, message.id, encryptedMessage.id)
      return false
    }
    if (message.type === MessageType.Info) {
      return true
    }
    return true
  }
}
