/* eslint import/first: 0 */
jest.mock('../../zcash')
jest.mock('../../vault')

import Immutable from 'immutable'
import { DateTime } from 'luxon'
import * as R from 'ramda'

import { IdentityState, Identity } from './identity'
import { setUsers } from './users'
import { NodeState } from './node'
import { epics, actions } from './contacts'
import create from '../create'
import { mock as zcashMock } from '../../zcash'
import { createArchive } from '../../vault/marshalling'
import { mock as vaultMock, getVault } from '../../vault'
import { messageType, getPublicKeysFromSignature } from '../../zbay/messages'
import testUtils from '../../testUtils'
import { packMemo, unpackMemo } from '../../zbay/transit'
import selectors, { Contact } from '../selectors/contacts'
import { MessageSender, ReceivedMessage } from './messages'
import operationsSelectors from '../selectors/operations'
import operationsHandlers, { operationTypes, PendingDirectMessageOp } from './operations'

describe('contacts reducer', () => {
  let store = null
  const [identity1, identity2] = testUtils.identities
  const identityAddress = identity1.address
  const identityId = 'identity-id-from-vault'

  const contact1 = MessageSender({
    replyTo: identity1.address,
    username: identity1.username
  })
  const contact2 = MessageSender({
    replyTo: identity2.address,
    username: identity2.username
  })

  const receivedMock = async address => {
    if (address === identityAddress) {
      const messagesForIdentity1 = await Promise.all(
        R.range(0, 2).map(async i => {
          const message = testUtils.messages.createSendableMessage({
            message: `message ${i} for ${identityAddress}`,
            createdAt: testUtils.now.minus({ hours: i }).toSeconds(),
            type: i % 2 ? messageType.BASIC : messageType.TRANSFER
          })
          return testUtils.transfers.createTransfer({
            txid: `tx-id-${i}-${identity1.address}`,
            memo: await packMemo(message)
          })
        })
      )

      const messagesForIdentity2 = await Promise.all(
        R.range(0, 2).map(async i => {
          const message = testUtils.messages.createSendableMessage({
            message: `message ${i} for ${identityAddress}`,
            createdAt: testUtils.now.minus({ hours: i }).toSeconds(),
            type: i % 2 ? messageType.BASIC : messageType.TRANSFER
          })
          return testUtils.transfers.createTransfer({
            txid: `tx-id-${i}-${identity2.address}`,
            memo: await packMemo(message)
          })
        })
      )

      const normalTransfers = await Promise.all(
        R.range(0, 2).map(async i => {
          const message = testUtils.messages.createMessage('test-id')
          return testUtils.transfers.createTransfer({
            txid: `tx-id-${i}-${identityAddress}`,
            memo: await packMemo(message)
          })
        })
      )
      return [...messagesForIdentity1, ...messagesForIdentity2, ...normalTransfers]
    }
    return []
  }

  const initialState = {
    identity: IdentityState({
      data: Identity({
        id: identityId,
        address: identityAddress,
        transparentAddress: 'test-transparent-identity-address',
        name: 'Saturn'
      })
    }),
    users: Immutable.Map(),
    node: NodeState({ isTestnet: false })
  }

  beforeEach(async () => {
    jest.clearAllMocks()
    window.Notification = jest.fn()
    jest.spyOn(DateTime, 'utc').mockImplementation(() => testUtils.now)
    store = create({
      initialState: Immutable.Map(initialState)
    })
    const transactions = await receivedMock(identityAddress)
    transactions.forEach(async txn => {
      const data = await unpackMemo(txn.memo)
      const publicKey0 = getPublicKeysFromSignature(data)[0].toString('hex')
      const publicKey1 = getPublicKeysFromSignature(data)[1].toString('hex')
      store.dispatch(
        setUsers({
          users: {
            [publicKey0]: {
              firstName: 'testfirstname',
              lastName: 'testlastname',
              nickname: 'testnickname',
              address: 'test adddress'
            },
            [publicKey1]: {
              firstName: 'testfirstname',
              lastName: 'testlastname',
              nickname: 'testnickname',
              address: 'test adddress'
            }
          }
        })
      )
    })
    zcashMock.requestManager.z_listreceivedbyaddress.mockImplementation(receivedMock)
  })

  describe('Direct messages reducer', () => {
    describe('handles actions', () => {
      describe('- setMessages', () => {
        const messages = Immutable.List(
          R.range(0, 2).map(id =>
            ReceivedMessage(
              testUtils.messages.createReceivedMessage({
                id,
                createdAt: testUtils.now.minus({ hours: 2 * id }).toSeconds(),
                sender: identity1
              })
            )
          )
        )

        it('when no contact', () => {
          store.dispatch(actions.setMessages({ messages, contactAddress: identity1.address }))

          const contact = selectors.contact(identity1.address)(store.getState())
          expect(contact).toMatchSnapshot()
        })

        it('when contact exists', () => {
          store = create({
            initialState: Immutable.Map({
              ...initialState,
              contacts: Immutable.Map({
                [identity1.address]: Contact({
                  username: identity1.username,
                  address: identity1.address
                })
              })
            })
          })

          store.dispatch(actions.setMessages({ messages, contactAddress: identity1.address }))

          const contact = selectors.contact(identity1.address)(store.getState())
          expect(contact).toMatchSnapshot()
        })
      })
      describe('- appendNewMessages', () => {
        const messagesIds = ['message-id-1', 'message-id-2']

        it('- when no contact', () => {
          store.dispatch(
            actions.appendNewMessages({ messagesIds, contactAddress: identity1.address })
          )

          const contact = selectors.contact(identity1.address)(store.getState())
          expect(contact).toMatchSnapshot()
        })

        it('- when contact exists', () => {
          store = create({
            initialState: Immutable.Map({
              ...initialState,
              contacts: Immutable.Map({
                [identity1.address]: Contact({
                  username: identity1.username,
                  address: identity1.address
                })
              })
            })
          })

          store.dispatch(
            actions.appendNewMessages({ messagesIds, contactAddress: identity1.address })
          )

          const contact = selectors.contact(identity1.address)(store.getState())
          expect(contact).toMatchSnapshot()
        })

        it('when there are already new messages', () => {
          store.dispatch(
            actions.appendNewMessages({
              messagesIds: ['prev-id-1'],
              contactAddress: identity1.address
            })
          )

          store.dispatch(
            actions.appendNewMessages({ messagesIds, contactAddress: identity1.address })
          )

          const contact = selectors.contact(identity1.address)(store.getState())
          expect(contact).toMatchSnapshot()
        })
      })

      describe('- cleanNewMessages', () => {
        it('- when no contact', () => {
          store.dispatch(actions.cleanNewMessages({ contactAddress: identity1.address }))

          const contact = selectors.contact(identity1.address)(store.getState())
          expect(contact).toMatchSnapshot()
        })

        it('- when contact exists', () => {
          store = create({
            initialState: Immutable.Map({
              ...initialState,
              contacts: Immutable.Map({
                [identity1.address]: Contact({
                  username: identity1.username,
                  address: identity1.address
                })
              })
            })
          })

          store.dispatch(actions.cleanNewMessages({ contactAddress: identity1.address }))

          const contact = selectors.contact(identity1.address)(store.getState())
          expect(contact).toMatchSnapshot()
        })

        it('when there are already new messages', () => {
          store.dispatch(
            actions.appendNewMessages({
              messagesIds: ['prev-id-1'],
              contactAddress: identity1.address
            })
          )

          store.dispatch(actions.cleanNewMessages({ contactAddress: identity1.address }))

          const contact = selectors.contact(identity1.address)(store.getState())
          expect(contact).toMatchSnapshot()
        })
      })

      describe('- setLastSeen', () => {
        it('- when no contact', () => {
          store.dispatch(
            actions.setLastSeen({
              lastSeen: testUtils.now,
              contact: contact1
            })
          )

          const contact = selectors.contact(identity1.address)(store.getState())
          expect(contact).toMatchSnapshot()
        })

        it('- when contact exists', () => {
          store = create({
            initialState: Immutable.Map({
              ...initialState,
              contacts: Immutable.Map({
                [identity1.address]: Contact({
                  username: identity1.username,
                  address: identity1.address
                })
              })
            })
          })

          store.dispatch(
            actions.setLastSeen({
              lastSeen: testUtils.now,
              contact: contact1
            })
          )

          const contact = selectors.contact(identity1.address)(store.getState())
          expect(contact).toMatchSnapshot()
        })

        it('when last seen already set', () => {
          store.dispatch(
            actions.setLastSeen({
              lastSeen: testUtils.now,
              contact: contact1
            })
          )

          store.dispatch(
            actions.setLastSeen({
              lastSeen: testUtils.now.plus({ hours: 2 }),
              contact: contact1
            })
          )

          const contact = selectors.contact(identity1.address)(store.getState())
          expect(contact).toMatchSnapshot()
        })
      })
      describe('- setUsernames', () => {
        it('- when no contact', () => {
          store.dispatch(
            actions.setUsernames({
              sender: contact1
            })
          )
          const contact = selectors.contact(identity1.address)(store.getState())
          expect(contact).toMatchSnapshot()
        })
        it('- when contact exists', () => {
          store = create({
            initialState: Immutable.Map({
              ...initialState,
              contacts: Immutable.Map({
                [identity1.address]: Contact({
                  username: identity1.username,
                  address: identity1.address
                })
              })
            })
          })

          store.dispatch(
            actions.setUsernames({
              sender: contact1
            })
          )

          const contact = selectors.contact(identity1.address)(store.getState())
          expect(contact).toMatchSnapshot()
        })

        it('when username already set', () => {
          store.dispatch(
            actions.setUsernames({
              sender: contact1
            })
          )

          store.dispatch(
            actions.setUsernames({
              sender: contact2
            })
          )

          const contact = selectors.contact(identity1.address)(store.getState())
          expect(contact).toMatchSnapshot()
        })
      })
    })

    describe('handles epics', () => {
      beforeEach(() => {
        vaultMock.setArchive(createArchive())
      })

      describe('- fetchMessages', () => {
        it('fetches messages', async () => {
          await store.dispatch(epics.fetchMessages())
          expect(selectors.contacts(store.getState())).toMatchSnapshot()
        })

        it('sets new messages', async () => {
          jest.spyOn(DateTime, 'utc').mockImplementation(() => testUtils.now.minus({ hours: 5 }))
          await store.dispatch(epics.updateLastSeen({ contact: contact1 }))
          jest.spyOn(DateTime, 'utc').mockImplementation(() => testUtils.now.minus({ minutes: 30 }))
          await store.dispatch(epics.updateLastSeen({ contact: contact2 }))

          await store.dispatch(epics.fetchMessages())

          expect(selectors.contacts(store.getState())).toMatchSnapshot()
        })

        it('displays notifications for vault', async () => {
          jest.spyOn(DateTime, 'utc').mockImplementation(() => testUtils.now.minus({ hours: 5 }))
          await store.dispatch(epics.updateLastSeen({ contact: contact1 }))
          await store.dispatch(epics.updateLastSeen({ contact: contact2 }))

          await store.dispatch(epics.fetchMessages())

          expect(window.Notification.mock.calls).toMatchSnapshot()
        })
      })

      describe('- updateLastSeen', () => {
        it('updates store when contact does not exist', async () => {
          await store.dispatch(epics.updateLastSeen({ contact: contact1 }))

          expect(selectors.contacts(store.getState())).toMatchSnapshot()
        })

        it('updates store when contact does exist', async () => {
          await store.dispatch(epics.updateLastSeen({ contact: contact1 }))
          jest.spyOn(DateTime, 'utc').mockImplementation(() => testUtils.now.plus({ minutes: 30 }))

          await store.dispatch(epics.updateLastSeen({ contact: contact1 }))

          expect(selectors.contacts(store.getState())).toMatchSnapshot()
        })

        it('updates vault when contact does not exist', async () => {
          await store.dispatch(epics.updateLastSeen({ contact: contact1 }))

          const newLastSeen = await getVault().contacts.getLastSeen({
            identityId,
            recipientAddress: contact1.replyTo,
            recipientUsername: contact1.username
          })

          expect(newLastSeen).toEqual(testUtils.now)
        })

        it('- resendMessage resend selected direct message', async () => {
          const messages = [testUtils.createSendableTransferMessage({})]
          const opId = `message-op-id`
          const message = {
            ...messages[0],
            id: opId
          }
          zcashMock.requestManager.z_getoperationstatus.mockImplementationOnce(async () => [
            {
              id: opId,
              status: 'failed',
              result: {
                txid: 'message-op-id'
              },
              error: { code: -1, message: 'no funds' }
            }
          ])
          zcashMock.requestManager.z_sendmany.mockResolvedValue('new-op-id')

          await store.dispatch(
            operationsHandlers.epics.observeOperation({
              meta: PendingDirectMessageOp({
                recipientAddress: message.receiver.replyTo,
                recipientUsername: message.receiver.username,
                message
              }),
              type: operationTypes.pendingDirectMessage,
              opId
            })
          )
          const beforeResend = operationsSelectors.pendingDirectMessages(store.getState())
          expect(beforeResend.getIn([opId, 'status'])).toEqual('failed')

          await store.dispatch(epics.resendMessage(message))

          const pendingMessages = operationsSelectors.pendingDirectMessages(store.getState())
          expect(pendingMessages.map(m => m.removeIn(['meta', 'recipientId']))).toMatchSnapshot()
        })
      })
    })
  })
})
