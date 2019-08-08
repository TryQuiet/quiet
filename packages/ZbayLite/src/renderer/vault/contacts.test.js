/* eslint import/first: 0 */
jest.mock('../zcash')

import { DateTime } from 'luxon'

import { createArchive } from './marshalling'
import messagesFactory from './contacts'

import testUtils from '../testUtils'

describe('messages', () => {
  const workspace = jest.mock()
  workspace.save = jest.fn()
  const vaultMock = {
    withWorkspace: async (cb) => cb(workspace),
    lock: async (arg) => arg
  }

  const identityId = 'this-is-a-test-id'
  const recipientAddress = 'zs1z7rejlpsa98s2rrrfkwmaxu53e4ue0ulcrw0h4x5g8jl04tak0d3mm47vdtahatqrlkngh9slba'
  const recipientUsername = 'Tommy'

  const messages = messagesFactory(vaultMock)

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(DateTime, 'utc').mockImplementation(() => testUtils.now)
    workspace.archive = createArchive()
  })

  describe('store own messages', () => {
    const message = testUtils.messages.createVaultMessage(1)
    const secondMessage = testUtils.messages.createVaultMessage(2)

    it('when no group for identity', async () => {
      await messages.saveMessage({ identityId, message, recipientAddress, recipientUsername })
      const [identitySender] = (
        workspace.archive
          .findGroupsByTitle('Contacts')[0]
          .getGroups()
          .filter(g => g.getTitle() === identityId)[0]
          .findGroupsByTitle(recipientAddress)
      )
      const [newSender] = identitySender.getEntries().map(e => e.toObject().properties)
      expect(newSender).toMatchSnapshot()
    })
    it('group should have two messages', async () => {
      await messages.saveMessage({ identityId, message, recipientAddress, recipientUsername })
      await messages.saveMessage({ identityId, message: secondMessage, recipientAddress, recipientUsername })
      const [identitySender] = (
        workspace.archive
          .findGroupsByTitle('Contacts')[0]
          .getGroups()
          .filter(g => g.getTitle() === identityId)[0]
          .findGroupsByTitle(recipientAddress)
      )
      const storedMessages = identitySender.getEntries().map(e => e.toObject().properties)
      expect(storedMessages).toMatchSnapshot()
    })
  })

  describe('get list of messages', () => {
    const message = testUtils.messages.createVaultMessage(1)
    const secondMessage = testUtils.messages.createVaultMessage(2)

    it('should return all messages sent to recipient', async () => {
      await messages.saveMessage({ identityId, message, recipientAddress, recipientUsername })
      await messages.saveMessage({ identityId, message: secondMessage, recipientAddress, recipientUsername })
      const messagesFromSender = await messages.listMessages({ identityId, recipientAddress, recipientUsername })
      expect(messagesFromSender).toMatchSnapshot()
    })

    it('should not crash if there is no messsages for identityId', async () => {
      await messages.saveMessage({ identityId, message, recipientAddress, recipientUsername })
      await messages.saveMessage({ identityId, message: secondMessage, recipientAddress, recipientUsername })
      const randomIdentity = 'new-identity-id'

      const messagesFromSender = await messages.listMessages({ identityId: randomIdentity, recipientAddress, recipientUsername })
      expect(messagesFromSender).toMatchSnapshot()
    })
  })

  describe('update message', () => {
    const message = testUtils.messages.createVaultMessage(1)

    it('should update message with appropriate id', async () => {
      await messages.saveMessage({ identityId, message, recipientAddress, recipientUsername })
      await messages.updateMessage({ messageId: message.id, identityId, recipientAddress, recipientUsername, newMessageStatus: 'sent' })
      const [recipientMessages] = (
        workspace.archive
          .findGroupsByTitle('Contacts')[0]
          .getGroups()
          .filter(g => g.getTitle() === identityId)[0]
          .findGroupsByTitle(recipientAddress)
      )
      const storedMessages = recipientMessages.getEntries().map(e => e.toObject().properties)
      expect(message).toMatchSnapshot()
      expect(storedMessages).toMatchSnapshot()
    })

    it('should not crash if message doesn\'t exist', async () => {
      expect.assertions(1)
      try {
        await messages.updateMessage({ messageId: message.id, identityId, recipientAddress, recipientUsername, newMessageStatus: 'sent' })
      } catch (err) {
        expect(err).toMatchSnapshot()
      }
    })
  })

  describe('delete message', () => {
    const message = testUtils.messages.createVaultMessage(1)
    const secondMessage = testUtils.messages.createVaultMessage(2)

    it('should delete message with appropriate id, recipient should have empty messages array', async () => {
      await messages.saveMessage({ identityId, message, recipientAddress, recipientUsername })
      await messages.deleteMessage({ messageId: message.id, identityId, recipientAddress, recipientUsername })
      const [recipientMessages] = (
        workspace.archive
          .findGroupsByTitle('Contacts')[0]
          .getGroups()
          .filter(g => g.getTitle() === identityId)[0]
          .findGroupsByTitle(recipientAddress)
      )
      const storedMessages = recipientMessages.getEntries().map(e => e.toObject().properties)
      expect(storedMessages).toMatchSnapshot()
    })

    it('should delete message with appropriate id, recipient should have messages array with message title = 2', async () => {
      await messages.saveMessage({ identityId, message, recipientAddress, recipientUsername })
      await messages.saveMessage({ identityId, message: secondMessage, recipientAddress, recipientUsername })
      await messages.deleteMessage({ messageId: message.id, identityId, recipientAddress, recipientUsername })
      const [recipientMessages] = (
        workspace.archive
          .findGroupsByTitle('Contacts')[0]
          .getGroups()
          .filter(g => g.getTitle() === identityId)[0]
          .findGroupsByTitle(recipientAddress)
      )
      const storedMessages = recipientMessages.getEntries().map(e => e.toObject().properties)
      expect(storedMessages).toMatchSnapshot()
    })

    it('should not crash if message doesn\'t exist', async () => {
      await messages.deleteMessage({ messageId: message.id, identityId, recipientAddress, recipientUsername })
      const [recipientMessages] = (
        workspace.archive
          .findGroupsByTitle('Contacts')[0]
          .getGroups()
          .filter(g => g.getTitle() === identityId)[0]
          .findGroupsByTitle(recipientAddress)
      )
      const storedMessages = recipientMessages.getEntries().map(e => e.toObject().properties)
      expect(storedMessages).toMatchSnapshot()
    })
  })

  describe('last seen value', () => {
    const message = testUtils.messages.createVaultMessage(1)

    it('should update lastSeen', async () => {
      const lastSeen = testUtils.now.minus({ hours: 2 })
      await messages.saveMessage({ identityId, message, recipientAddress, recipientUsername })
      await messages.updateLastSeen({ identityId, recipientAddress, recipientUsername, lastSeen })
      const [identitySender] = (
        workspace.archive
          .findGroupsByTitle('Contacts')[0]
          .getGroups()
          .filter(g => g.getTitle() === identityId)[0]
          .findGroupsByTitle(recipientAddress)
      )
      expect(lastSeen.toSeconds().toString()).toEqual(identitySender.getAttribute('lastSeen'))
    })

    it('should update lastSeen if there is no identity', async () => {
      const lastSeen = testUtils.now.minus({ hours: 2 })
      const randomIdentity = 'new-identity-id'
      await messages.saveMessage({ identityId, message, recipientAddress, recipientUsername })
      await messages.updateLastSeen({ identityId: randomIdentity, recipientAddress, recipientUsername, lastSeen })
      const [identitySender] = (
        workspace.archive
          .findGroupsByTitle('Contacts')[0]
          .getGroups()
          .filter(g => g.getTitle() === randomIdentity)[0]
          .findGroupsByTitle(recipientAddress)
      )
      expect(lastSeen.toSeconds().toString()).toEqual(identitySender.getAttribute('lastSeen'))
    })

    it('should update lastSeen if there is identity but for new recipient', async () => {
      const lastSeen = testUtils.now.minus({ hours: 2 })
      const randomIdentity = 'new-identity-id'
      const randomRecipient = 'zs1z7rejlpsa98s2rrrfkwmaxu53e4ue0ulcrw0h4x5g8jl04tak0d3mm47vdtahatqrlkngh9slk4'
      await messages.saveMessage({ identityId, message, recipientAddress, recipientUsername })
      await messages.updateLastSeen({ identityId: randomIdentity, recipientAddress: randomRecipient, recipientUsername, lastSeen })
      const [identitySender] = (
        workspace.archive
          .findGroupsByTitle('Contacts')[0]
          .getGroups()
          .filter(g => g.getTitle() === randomIdentity)[0]
          .findGroupsByTitle(randomRecipient)
      )
      expect(lastSeen.toSeconds().toString()).toEqual(identitySender.getAttribute('lastSeen'))
    })

    it('should return lastSeen value', async () => {
      await messages.saveMessage({ identityId, message, recipientAddress, recipientUsername })
      const lastSeenValue = await messages.getLastSeen({ identityId, recipientAddress, recipientUsername })
      expect(lastSeenValue).toMatchSnapshot()
    })

    it('should return null for lastSeen if no identity', async () => {
      const randomIdentity = 'new-identity-id'
      await messages.saveMessage({ identityId, message, recipientAddress, recipientUsername })
      const lastSeenValue = await messages.getLastSeen({ randomIdentity, recipientAddress, recipientUsername })
      expect(lastSeenValue).toMatchSnapshot()
    })

    it('should return null for lastSeen if there is identity and no recipiet', async () => {
      await messages.saveMessage({ identityId, message, recipientAddress, recipientUsername })
      const lastSeenValue = await messages.getLastSeen({ identityId, recipientAddress, recipientUsername })
      expect(lastSeenValue).toMatchSnapshot()
    })
  })
})
