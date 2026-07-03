import { Injectable } from '@nestjs/common'

import { ChannelMessage, CompoundError, ConsumedChannelMessage } from '@quiet/types'

import { createLogger } from '../../../common/logger'
import { EncryptionScopeType } from '../../../auth/services/crypto/types'
import { SigChainService } from '../../../auth/sigchain.service'
import { EncryptableMessageComponents, EncryptedMessage } from './messages.types'
import { BaseMessagesService } from './base-messages.service'
import { SigChain } from '../../../auth/sigchain'

@Injectable()
export class PrivateChannelMessagesService extends BaseMessagesService {
  protected readonly logger = createLogger(`storage:channels:privateChannelsMessagesService`)

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
    this.logger.debug('Sending private channel message')
    return this._encryptPrivateChannelMessage(message)
  }

  /**
   * Handle processing of message consumed from OrbitDB
   *
   * @param message Message consumed from OrbitDB
   * @returns Processed message if decryptable, undefined if undecryptable and false if intentionally skip decryption
   */
  public async onConsume(message: EncryptedMessage): Promise<ConsumedChannelMessage | false | undefined> {
    this.logger.debug('Received private channel message')
    const chain = this.sigChainService.getChain(message.teamId, false)
    if (chain == null) {
      this.logger.warn(
        `Chain doesn't exist or hasn't been initialized, can't consume messages for ${message.channelId}`
      )
      return false
    }
    if (!chain.channels.amIMemberOfChannel(message.channelId)) {
      this.logger.warn(`Not a member of channel ${message.channelId} on team ${message.teamId}`)
      return false
    }

    try {
      const decryptedMessage = this._decryptPrivateChannelMessage(message, chain)
      if (!this.validateMessage(decryptedMessage, message)) {
        return
      }
      return decryptedMessage
    } catch (e) {
      this.logger.error(`Failed to process message on consume`, e)
      return
    }
  }

  private _encryptPrivateChannelMessage(rawMessage: ChannelMessage): EncryptedMessage {
    try {
      const chain = this.sigChainService.getActiveChain()
      const encryptable: EncryptableMessageComponents = {
        id: rawMessage.id,
        userId: chain.user.userId,
        type: rawMessage.type,
        channelId: rawMessage.channelId,
        message: rawMessage.message,
        media: rawMessage.media,
        teamId: chain.team!.id,
        createdAt: rawMessage.createdAt,
      }
      const roleName = chain.channels.generateChannelRoleName(rawMessage.channelId)
      const encryptedMessage = chain.crypto.encryptAndSign(encryptable, {
        type: EncryptionScopeType.ROLE,
        name: roleName,
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

  private _decryptPrivateChannelMessage(encryptedMessage: EncryptedMessage, chain: SigChain): ConsumedChannelMessage {
    try {
      const decryptedMessage = chain.crypto.decryptAndVerify<EncryptableMessageComponents>(
        encryptedMessage.contents,
        encryptedMessage.encSignature,
        false
      )
      return {
        ...decryptedMessage.contents,
        encSignature: encryptedMessage.encSignature,
        verified: decryptedMessage.isValid,
      }
    } catch (e) {
      throw new CompoundError(`Failed to decrypt message with error`, e)
    }
  }
}
