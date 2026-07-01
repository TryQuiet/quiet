import { jest } from '@jest/globals'

import { Test, TestingModule } from '@nestjs/testing'
import { getBaseTypesFactory } from '@quiet/state-manager'
import { ChannelMessage } from '@quiet/types'
import { FactoryGirl } from 'factory-girl'
import { isUint8Array } from 'util/types'
import { EncryptionScopeType } from '../../../auth/services/crypto/types'
import { RoleName } from '../../../auth/services/roles/roles'
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

  let factory: FactoryGirl
  let message: ChannelMessage

  let handleChainUpdateSpy: jest.SpiedFunction<any>

  beforeAll(async () => {
    factory = await getBaseTypesFactory()
  })

  beforeEach(async () => {
    jest.clearAllMocks()

    module = await Test.createTestingModule({
      imports: [TestModule, StorageModule],
    }).compile()

    sigChainService = await module.resolve(SigChainService)
    await sigChainService.createChain('alice', true)
    message = await factory.create('ChannelMessage', { userId: sigChainService.getActiveChain().user.userId })
    sigChainService.activeChain.channels.create(message.channelId)
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
      const encryptedMessage = await messagesService.onSend(message)
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
              name: sigChainService.activeChain.channels.generateChannelRoleName(message.channelId),
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
      const encryptedMessage = await messagesService.onSend(message)
      expect(await messagesService.onConsume(encryptedMessage)).toEqual({
        ...message,
        verified: true,
        encSignature: encryptedMessage.encSignature,
        teamId: encryptedMessage.teamId,
      })
    })

    // https://github.com/TryQuiet/quiet/issues/3304
    it('fails to consume message with mismatched createdAt', async () => {
      const encryptedMessage = await messagesService.onSend(message)
      const mismatchedEncryptedMessage: EncryptedMessage = {
        ...encryptedMessage,
        createdAt: 1234,
      }
      expect(await messagesService.onConsume(mismatchedEncryptedMessage)).toBeFalsy()
    })

    // https://github.com/TryQuiet/quiet/issues/3304
    it('fails to consume message with mismatched team ID', async () => {
      const encryptedMessage = await messagesService.onSend(message)
      const mismatchedEncryptedMessage: EncryptedMessage = {
        ...encryptedMessage,
        teamId: 'THIS IS INVALID',
      }
      expect(await messagesService.onConsume(mismatchedEncryptedMessage)).toBeFalsy()
    })

    // https://github.com/TryQuiet/quiet/issues/3304
    it('fails to consume message with mismatched channel ID', async () => {
      const encryptedMessage = await messagesService.onSend(message)
      const mismatchedEncryptedMessage: EncryptedMessage = {
        ...encryptedMessage,
        channelId: 'THIS IS INVALID',
      }
      expect(await messagesService.onConsume(mismatchedEncryptedMessage)).toBeFalsy()
    })

    it('returns undefined when the signature is invalid', async () => {
      const encryptedMessage = await messagesService.onSend(message)
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

      expect(await messagesService.onConsume(invalidEncryptedMessage)).toBeUndefined()
    })
  })
})
