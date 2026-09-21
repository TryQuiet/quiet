import { Injectable } from '@nestjs/common'
import { ChannelType, type ChannelMessage, type ConsumedChannelMessage, type PublicChannel } from '@quiet/types'
import { SigChainService } from '../../../auth/sigchain.service'
import { BaseMessagesService } from './base-messages.service'
import type { EncryptedMessage } from './messages.types'

@Injectable()
export class DirectMessagesService extends BaseMessagesService {
  constructor(protected readonly sigChainService: SigChainService) {
    super(sigChainService)
  }

  public async onSend(message: ChannelMessage, channel: PublicChannel): Promise<EncryptedMessage> {
    if (channel.type !== ChannelType.DM) throw new Error('Invalid DM channel')
    const encrypted = this.sigChainService.getActiveChain().directMessages.sealMessage(message, channel.id)
    if (!(await this.onConsume(encrypted, channel))) throw new Error('Invalid DM message')
    return encrypted
  }

  public async onConsume(
    encrypted: EncryptedMessage,
    channel: PublicChannel
  ): Promise<ConsumedChannelMessage | undefined> {
    try {
      if (channel.type !== ChannelType.DM) return undefined
      const chain = this.sigChainService.getChain(encrypted.teamId, false)
      if (!chain) return undefined
      const message: ConsumedChannelMessage = {
        ...chain.directMessages.openMessage(encrypted, channel.id),
        encSignature: encrypted.encSignature,
        verified: true,
      }
      return this.validateMessage(message, encrypted, channel) ? message : undefined
    } catch {
      // A failed DM must not expose plaintext/keys through diagnostic errors.
      return undefined
    }
  }
}
