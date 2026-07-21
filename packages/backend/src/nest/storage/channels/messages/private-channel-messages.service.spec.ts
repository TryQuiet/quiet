import { jest } from '@jest/globals'

import { Test, TestingModule } from '@nestjs/testing'
import { getBaseTypesFactory } from '@quiet/state-manager'
import { ChannelMessage, type PublicChannel } from '@quiet/types'
import { FactoryGirl } from 'factory-girl'
import { isUint8Array } from 'util/types'
import { EncryptionScopeType } from '../../../auth/services/crypto/types'
import { SigChainService } from '../../../auth/sigchain.service'
import { createLogger } from '../../../common/logger'
import { TestModule } from '../../../common/test.module'
import { StorageModule } from '../../storage.module'
import { EncryptedMessage } from './messages.types'
import { isEncryptedMessage } from '../../../validation/validators'
import { PrivateChannelMessagesService } from './private-channel-messages.service'

const logger = createLogger('privateChannelMessagesService:test')

describe('PrivateChannelMessagesService', () => {
  let module: TestingModule
  let messagesService: PrivateChannelMessagesService
  let sigChainService: SigChainService
  let channelRoleName: string

  let factory: FactoryGirl
  let message: ChannelMessage
  let channel: PublicChannel

  let handleChainUpdateSpy: jest.SpiedFunction<any>

  const INVALID_FIELD_VALUE = 'THIS IS INVALID'

  beforeAll(async () => {
    factory = await getBaseTypesFactory()
  })

  beforeEach(async () => {
    jest.clearAllMocks()

    module = await Test.createTestingModule({
      imports: [TestModule, StorageModule],
    }).compile()

    sigChainService = await module.resolve(SigChainService)
    await sigChainService.createChain(true)
    message = await factory.create('ChannelMessage', { userId: sigChainService.getActiveChain().user.userId })
    channelRoleName = sigChainService.activeChain.channels.create()
    channel = await factory.create<PublicChannel>('PublicChannel', {
      id: message.channelId,
      public: false,
      roleName: channelRoleName,
    })
    messagesService = await module.resolve(PrivateChannelMessagesService)
    handleChainUpdateSpy = jest.spyOn(sigChainService as any, 'handleChainUpdate').mockImplementation(() => {
      logger.debug('MOCK: handling chain update')
    })
  })

  afterEach(async () => {
    handleChainUpdateSpy.mockReset()
    await module.close()
  })

  describe('onSend', () => {
    it('encrypts message correctly', async () => {
      const encryptedMessage = await messagesService.onSend(message, channel)
      expect(isEncryptedMessage(encryptedMessage)).toBeTruthy()
      expect(encryptedMessage).toEqual(
        expect.objectContaining({
          id: message.id,
          teamId: sigChainService.team.id,
          createdAt: message.createdAt,
          channelId: message.channelId,
          contents: expect.objectContaining({
            contents: expect.any(Uint8Array),
            scope: {
              generation: 0,
              type: EncryptionScopeType.ROLE,
              name: expect.any(String),
            },
          }),
          encSignature: expect.objectContaining({
            author: expect.objectContaining({
              generation: 0,
              type: EncryptionScopeType.USER,
              name: sigChainService.getActiveChain().user.userId,
            }),
            signature: expect.any(String),
          }),
        })
      )
      expect(isUint8Array(encryptedMessage.contents.contents)).toBeTruthy()
    })
  })

  describe('onConsume', () => {
    it('decrypts an encrypted message correctly', async () => {
      const encryptedMessage = await messagesService.onSend(message, channel)
      expect(await messagesService.onConsume(encryptedMessage, channel)).toEqual({
        ...message,
        verified: true,
        encSignature: encryptedMessage.encSignature,
        teamId: encryptedMessage.teamId,
      })
    })

    // https://github.com/TryQuiet/quiet/issues/3304
    it('fails to consume message with mismatched createdAt', async () => {
      const encryptedMessage = await messagesService.onSend(message, channel)
      const mismatchedEncryptedMessage: EncryptedMessage = {
        ...encryptedMessage,
        createdAt: 1234,
      }
      expect(await messagesService.onConsume(mismatchedEncryptedMessage, channel)).toBeFalsy()
    })

    // https://github.com/TryQuiet/quiet/issues/3304
    it('fails to consume message with mismatched team ID', async () => {
      const encryptedMessage = await messagesService.onSend(message, channel)
      const mismatchedEncryptedMessage: EncryptedMessage = {
        ...encryptedMessage,
        teamId: INVALID_FIELD_VALUE,
      }
      expect(await messagesService.onConsume(mismatchedEncryptedMessage, channel)).toBeFalsy()
    })

    // https://github.com/TryQuiet/quiet/issues/3304
    it('fails to consume message with mismatched channel ID', async () => {
      const encryptedMessage = await messagesService.onSend(message, channel)
      const mismatchedEncryptedMessage: EncryptedMessage = {
        ...encryptedMessage,
        channelId: INVALID_FIELD_VALUE,
      }
      expect(await messagesService.onConsume(mismatchedEncryptedMessage, channel)).toBeFalsy()
    })

    // https://github.com/TryQuiet/quiet/issues/3334
    it('fails to consume message with mismatched user ID', async () => {
      const messageWithBadUserId: ChannelMessage = {
        ...message,
        userId: INVALID_FIELD_VALUE,
      }
      const encryptedMessage = await messagesService.onSend(messageWithBadUserId, channel)
      expect(await messagesService.onConsume(encryptedMessage, channel)).toBeFalsy()
    })

    it('returns undefined when the signature is invalid', async () => {
      const encryptedMessage = await messagesService.onSend(message, channel)
      const invalidEncryptedMessage: EncryptedMessage = {
        ...encryptedMessage,
        encSignature: {
          ...encryptedMessage.encSignature,
          author: {
            generation: 1,
            name: 'foobar',
            type: '',
          },
        },
      }

      expect(await messagesService.onConsume(invalidEncryptedMessage, channel)).toBeUndefined()
    })
  })
})
