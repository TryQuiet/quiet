import { Injectable } from '@nestjs/common'

import { ChannelMessage, CompoundError, ConsumedChannelMessage, type PublicChannel } from '@quiet/types'

import { createLogger } from '../../../common/logger'
import { EncryptionScopeType } from '../../../auth/services/crypto/types'
import { SigChainService } from '../../../auth/sigchain.service'
import { EncryptableMessageComponents, EncryptedMessage } from './messages.types'
import { BaseMessagesService } from './base-messages.service'
import { SigChain } from '../../../auth/sigchain'
import { RoleName } from '../../../auth/services/roles/roles'

@Injectable()
export class PrivateChannelMessagesService extends BaseMessagesService {
  protected readonly logger = createLogger(`storage:channels:privateChannelsMessagesService`)

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
    this.logger.debug('Sending private channel message')
    return this._encryptPrivateChannelMessage(rawMessage, channel)
  }

  /**
   * Handle processing of message consumed from OrbitDB
   *
   * @param encryptedMessage Message consumed from OrbitDB
   * @param channel The metadata for the channel this message is being received on on
   * @returns Processed message if decryptable, undefined if undecryptable and false if intentionally skip decryption
   */
  public async onConsume(
    encryptedMessage: EncryptedMessage,
    channel: PublicChannel
  ): Promise<ConsumedChannelMessage | false | undefined> {
    this.logger.debug('Received private channel message')
    const chain = this.sigChainService.getChain(encryptedMessage.teamId, false)
    if (chain == null) {
      this.logger.warn(
        `Chain doesn't exist or hasn't been initialized, can't consume messages for ${encryptedMessage.channelId}`
      )
      return false
    }

    try {
      const decryptedMessage = this._decryptPrivateChannelMessage(encryptedMessage, chain, channel)
      if (!this.validateMessage(decryptedMessage, encryptedMessage, channel)) {
        return
      }
      return decryptedMessage
    } catch (e) {
      this.logger.error(`Failed to process message on consume`, e)
      return
    }
  }

  private _encryptPrivateChannelMessage(rawMessage: ChannelMessage, channel: PublicChannel): EncryptedMessage {
    try {
      if (channel.roleName == null) {
        throw new Error('Private channel role name was nullish')
      }

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
        name: channel.roleName,
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

  private _decryptPrivateChannelMessage(
    encryptedMessage: EncryptedMessage,
    chain: SigChain,
    channel: PublicChannel
  ): ConsumedChannelMessage {
    try {
      if (
        encryptedMessage.contents.scope.name === RoleName.MEMBER ||
        encryptedMessage.contents.scope.name === RoleName.ADMIN
      ) {
        throw new Error('Private channel role name cannot be MEMBER or ADMIN')
      }

      if (channel.roleName !== encryptedMessage.contents.scope.name) {
        throw new Error('Private channel metadata role name did not match the role name on the message')
      }

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
