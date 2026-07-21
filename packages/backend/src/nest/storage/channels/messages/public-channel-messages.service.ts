import { Injectable } from '@nestjs/common'

import { ChannelMessage, CompoundError, ConsumedChannelMessage, type PublicChannel } from '@quiet/types'

import { createLogger } from '../../../common/logger'
import { EncryptionScopeType } from '../../../auth/services/crypto/types'
import { SigChainService } from '../../../auth/sigchain.service'
import { EncryptableMessageComponents, EncryptedMessage } from './messages.types'
import { RoleName } from '../../../auth/services/roles/roles'
import { BaseMessagesService } from './base-messages.service'
import { SigChain } from '../../../auth/sigchain'

@Injectable()
export class PublicChannelMessagesService extends BaseMessagesService {
  protected readonly logger = createLogger(`storage:channels:publicChannelsMessagesService`)

  constructor(protected readonly sigChainService: SigChainService) {
    super(sigChainService)
  }

  /**
   * Handle processing of message to be added to OrbitDB and sent to peers
   *
   * @param rawMessage Message to send
   * @param channel The metadata for the channel this message is being sent on
   * @returns Processed message
   */
  public async onSend(rawMessage: ChannelMessage, channel: PublicChannel): Promise<EncryptedMessage> {
    this.logger.debug('Sending public channel message')
    if (channel.roleName != null) {
      this.logger.warn('onSend: Public channel metadata contained a non-null role name')
    }
    return this._encryptPublicChannelMessage(rawMessage)
  }

  /**
   * Handle processing of message consumed from OrbitDB
   *
   * @param encryptedMessage Message consumed from OrbitDB
   * @param channel The metadata for the channel this message is being received on
   * @returns Processed message if decryptable, undefined if undecryptable and false if intentionally skip decryption
   */
  public async onConsume(
    encryptedMessage: EncryptedMessage,
    channel: PublicChannel
  ): Promise<ConsumedChannelMessage | undefined | false> {
    this.logger.debug('Received public channel message')
    const chain = this.sigChainService.getChain(encryptedMessage.teamId, false)
    if (chain == null) {
      this.logger.warn(
        `onConsume: Chain doesn't exist or hasn't been initialized, can't consume messages for ${encryptedMessage.channelId}`
      )
      return false
    }
    if (!chain.roles.amIMemberOfRole(RoleName.MEMBER)) {
      this.logger.warn(
        `onConsume: Not a member of team ${encryptedMessage.teamId}, can't consume messages for ${encryptedMessage.channelId}`
      )
      return false
    }
    if (channel.roleName != null) {
      this.logger.warn('onConsume: Public channel metadata contained a non-null role name')
    }

    try {
      const decryptedMessage = this._decryptPublicChannelMessage(encryptedMessage, chain)
      if (!this.validateMessage(decryptedMessage, encryptedMessage, channel)) {
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
        userId: rawMessage.userId,
        type: rawMessage.type,
        channelId: rawMessage.channelId,
        message: rawMessage.message,
        media: rawMessage.media,
        teamId: chain.team!.id,
        createdAt: rawMessage.createdAt,
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

  private _decryptPublicChannelMessage(encryptedMessage: EncryptedMessage, chain: SigChain): ConsumedChannelMessage {
    try {
      const decryptedMessage = chain.crypto.decryptAndVerify<EncryptableMessageComponents>(
        encryptedMessage.contents,
        encryptedMessage.encSignature,
        false
      )
      return {
        ...decryptedMessage.contents,
        userId: decryptedMessage.contents.userId,
        createdAt: decryptedMessage.contents.createdAt,
        encSignature: encryptedMessage.encSignature,
        verified: decryptedMessage.isValid,
      }
    } catch (e) {
      throw new CompoundError(`Failed to decrypt message with error`, e)
    }
  }
}
