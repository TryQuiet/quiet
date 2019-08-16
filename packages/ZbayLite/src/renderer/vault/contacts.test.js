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
  const txId = '87ccae921436493ff4ec03edd9c0fe66d863cf0e05b5f9ee49f08fa6823f700c'
  const status = 'brodcasted'

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
      await messages.saveMessage({ identityId, message, recipientAddress, recipientUsername, txId, status })
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
      const txId = '1c2001077c2475c8a241fb514bec5224de3ca73be7ed7d782f2efbf689fea6bb'
      await messages.saveMessage({ identityId, message, recipientAddress, recipientUsername, txId, status })
      await messages.saveMessage({ identityId, message: secondMessage, recipientAddress, recipientUsername, txId, status })
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
      const otherTxId = '1c2001077c2475c8a241fb514bec5224de3ca73be7ed7d782f2efbf689fea6bb'
      await messages.saveMessage({ identityId, message, recipientAddress, recipientUsername, status, txId: otherTxId })
      await messages.saveMessage({ identityId, message: secondMessage, recipientAddress, recipientUsername, status, txId })
      const messagesFromSender = await messages.listMessages({ identityId, recipientAddress, recipientUsername })
      expect(messagesFromSender).toMatchSnapshot()
    })

    it('should not crash if there is no messsages for identityId', async () => {
      const otherTxId = '1c2001077c2475c8a241fb514bec5224de3ca73be7ed7d782f2efbf689fea6bb'
      await messages.saveMessage({ identityId, message, recipientAddress, recipientUsername, txId: otherTxId, status })
      await messages.saveMessage({ identityId, message: secondMessage, recipientAddress, recipientUsername, txId, status })
      const randomIdentity = 'new-identity-id'

      const messagesFromSender = await messages.listMessages({ identityId: randomIdentity, recipientAddress, recipientUsername })
      expect(messagesFromSender).toMatchSnapshot()
    })
  })

  describe('update message', () => {
    const message = testUtils.messages.createVaultMessage(1)

    it('should update message with appropriate id', async () => {
      await messages.saveMessage({ identityId, message, recipientAddress, recipientUsername, txId, status })
      await messages.updateMessage({ messageId: txId, identityId, recipientAddress, recipientUsername, newMessageStatus: 'sent' })
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
      await messages.saveMessage({ identityId, message, recipientAddress, recipientUsername, txId, status })
      await messages.deleteMessage({ messageId: txId, identityId, recipientAddress, recipientUsername })
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
      const otherTxId = 'c9115101fd36eed535366c87c4bca473b4eee8545c118d16e7f34a162b7463ad'
      await messages.saveMessage({ identityId, message, recipientAddress, recipientUsername, txId, status })
      await messages.saveMessage({ identityId, message: secondMessage, recipientAddress, txId: otherTxId, status, recipientUsername })
      await messages.deleteMessage({ messageId: txId, identityId, recipientAddress, recipientUsername })
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
      await messages.saveMessage({ identityId, message, recipientAddress, recipientUsername, txId, status })
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
      await messages.saveMessage({ identityId, message, recipientAddress, recipientUsername, txId, status })
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
      await messages.saveMessage({ identityId, message, recipientAddress, recipientUsername, txId, status })
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
      await messages.saveMessage({ identityId, message, recipientAddress, recipientUsername, txId, status })
      const lastSeenValue = await messages.getLastSeen({ identityId, recipientAddress, recipientUsername })
      expect(lastSeenValue).toMatchSnapshot()
    })

    it('should return null for lastSeen if no identity', async () => {
      const randomIdentity = 'new-identity-id'
      await messages.saveMessage({ identityId, message, recipientAddress, recipientUsername, txId, status })
      const lastSeenValue = await messages.getLastSeen({ randomIdentity, recipientAddress, recipientUsername })
      expect(lastSeenValue).toMatchSnapshot()
    })

    it('should return null for lastSeen if there is identity and no recipiet', async () => {
      await messages.saveMessage({ identityId, message, recipientAddress, recipientUsername, txId, status })
      const lastSeenValue = await messages.getLastSeen({ identityId, recipientAddress, recipientUsername })
      expect(lastSeenValue).toMatchSnapshot()
    })
  })
})
