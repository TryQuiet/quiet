/* eslint import/first: 0 */
jest.mock('../../zcash')
jest.mock('../../vault')

import Immutable from 'immutable'
import { DateTime } from 'luxon'
import * as R from 'ramda'

import { IdentityState, Identity } from './identity'
import { NodeState } from './node'
import { epics, actions } from './contacts'
import create from '../create'
import { mock as zcashMock } from '../../zcash'
import { createArchive } from '../../vault/marshalling'
import { mock as vaultMock, getVault } from '../../vault'
import { messageType } from '../../zbay/messages'
import testUtils from '../../testUtils'
import { packMemo } from '../../zbay/transit'
import selectors, { Contact } from '../selectors/contacts'
import { MessageSender, ReceivedMessage } from './messages'

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

  const receivedMock = async (address) => {
    if (address === identityAddress) {
      const messagesForIdentity1 = await Promise.all(R.range(0, 2).map(
        async (i) => {
          const message = testUtils.messages.createSendableMessage({
            message: `message ${i} for ${identityAddress}`,
            createdAt: testUtils.now.minus({ hours: i }).toSeconds(),
            replyTo: identity1.address,
            username: identity1.username,
            type: i % 2 ? messageType.BASIC : messageType.TRANSFER
          })
          return testUtils.transfers.createTransfer({
            txid: `tx-id-${i}-${identity1.address}`,
            memo: await packMemo(message)
          })
        }
      ))

      const messagesForIdentity2 = await Promise.all(R.range(0, 2).map(
        async (i) => {
          const message = testUtils.messages.createSendableMessage({
            message: `message ${i} for ${identityAddress}`,
            createdAt: testUtils.now.minus({ hours: i }).toSeconds(),
            replyTo: identity2.address,
            username: identity2.username,
            type: i % 2 ? messageType.BASIC : messageType.TRANSFER
          })
          return testUtils.transfers.createTransfer({
            txid: `tx-id-${i}-${identity2.address}`,
            memo: await packMemo(message)
          })
        }
      ))

      const normalTransfers = await Promise.all(R.range(0, 2).map(
        async (i) => testUtils.transfers.createTransfer({
          txid: `tx-id-${i}-${identityAddress}`,
          memo: Buffer.from(`This is a simple transfer nr ${i}`).toString('hex')
        })
      ))
      return [
        ...messagesForIdentity1,
        ...messagesForIdentity2,
        ...normalTransfers
      ]
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
    node: NodeState({ isTestnet: false })
  }

  beforeEach(() => {
    jest.clearAllMocks()
    window.Notification = jest.fn()
    jest.spyOn(DateTime, 'utc').mockImplementation(() => testUtils.now)
    store = create({
      initialState: Immutable.Map(initialState)
    })
    zcashMock.requestManager.z_listreceivedbyaddress.mockImplementation(receivedMock)
  })

  describe('Direct messages reducer', () => {
    describe('handles actions', () => {
      describe('- setMessages', () => {
        const messages = Immutable.List(
          R.range(0, 2).map(id => ReceivedMessage(
            testUtils.messages.createReceivedMessage({
              id,
              createdAt: testUtils.now.minus({ hours: 2 * id }).toSeconds(),
              sender: identity1
            })
          ))

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
          store.dispatch(actions.appendNewMessages({ messagesIds, contactAddress: identity1.address }))

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

          store.dispatch(actions.appendNewMessages({ messagesIds, contactAddress: identity1.address }))

          const contact = selectors.contact(identity1.address)(store.getState())
          expect(contact).toMatchSnapshot()
        })

        it('when there are already new messages', () => {
          store.dispatch(actions.appendNewMessages({ messagesIds: ['prev-id-1'], contactAddress: identity1.address }))

          store.dispatch(actions.appendNewMessages({ messagesIds, contactAddress: identity1.address }))

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
          store.dispatch(actions.appendNewMessages({ messagesIds: ['prev-id-1'], contactAddress: identity1.address }))

          store.dispatch(actions.cleanNewMessages({ contactAddress: identity1.address }))

          const contact = selectors.contact(identity1.address)(store.getState())
          expect(contact).toMatchSnapshot()
        })
      })

      describe('- setLastSeen', () => {
        it('- when no contact', () => {
          store.dispatch(actions.setLastSeen({
            lastSeen: testUtils.now,
            contact: contact1
          }))

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

          store.dispatch(actions.setLastSeen({
            lastSeen: testUtils.now,
            contact: contact1
          }))

          const contact = selectors.contact(identity1.address)(store.getState())
          expect(contact).toMatchSnapshot()
        })

        it('when last seen already set', () => {
          store.dispatch(actions.setLastSeen({
            lastSeen: testUtils.now,
            contact: contact1
          }))

          store.dispatch(actions.setLastSeen({
            lastSeen: testUtils.now.plus({ hours: 2 }),
            contact: contact1
          }))

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
      })
    })
  })
})
