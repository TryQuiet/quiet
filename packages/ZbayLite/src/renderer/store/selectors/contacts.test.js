/* eslint import/first: 0 */
import Immutable from 'immutable'
import * as R from 'ramda'

import create from '../create'
import selectors, { Contact } from './contacts'
import testUtils from '../../testUtils'
import { ReceivedMessage } from '../handlers/messages'
import { operationTypes, PendingDirectMessageOp, Operation } from '../handlers/operations'
import { PendingMessage } from '../handlers/directMessagesQueue'

describe('operations selectors', () => {
  const [identity1, identity2] = testUtils.identities
  const messages = Immutable.List(
    R.range(0, 2).map(id => ReceivedMessage(
      testUtils.messages.createReceivedMessage({
        id,
        createdAt: testUtils.now.minus({ hours: 2 * id }).toSeconds(),
        sender: identity1
      })
    ))
  )
  const vaultMessages = Immutable.List(
    R.range(0, 2).map(id => ReceivedMessage(
      testUtils.messages.createReceivedMessage({
        id,
        createdAt: testUtils.now.minus({ hours: 2 * id }).toSeconds(),
        sender: identity1
      })
    ))
  )
  const recipientUsername = 'test-recipient-username'

  let store = null
  beforeEach(() => {
    store = create({
      initialState: Immutable.Map({
        contacts: Immutable.Map({
          [identity1.address]: Contact({
            username: identity1.username,
            address: identity1.address,
            messages,
            vaultMessages,
            lastSeen: testUtils.now,
            newMessages: Immutable.List([ 1, 2, 3, 4 ])
          }),
          [identity2.address]: Contact({
            username: identity2.username,
            address: identity2.address
          })
        }),
        directMessagesQueue: Immutable.Map({
          'messageHash': PendingMessage({
            recipientAddress: identity1.address,
            recipientUsername,
            message: Immutable.fromJS(
              testUtils.createMessage('test-pending-message', testUtils.now.minus({ hours: 2 }).toSeconds())
            )
          })
        }),
        operations: Immutable.fromJS({
          'test-operation-id': Operation({
            opId: 'test-operation-id',
            txId: 'transaction-id',
            type: operationTypes.pendingDirectMessage,
            meta: PendingDirectMessageOp({
              message: Immutable.fromJS(testUtils.createMessage(
                'test-message-id',
                testUtils.now.minus({ hours: 1 }).toSeconds()
              )),
              recipientAddress: identity1.address,
              recipientUsername
            }),
            status: 'success'
          }),
          'test-operation-id-2': Operation({
            opId: 'test-operation-id-2',
            txId: 'transaction-id-2',
            type: operationTypes.pendingDirectMessage,
            meta: PendingDirectMessageOp({
              message: Immutable.fromJS(testUtils.createMessage(
                'test-message-id-2',
                testUtils.now.minus({ hours: 3 }).toSeconds()
              )),
              recipientAddress: identity1.address,
              recipientUsername
            }),
            status: 'success'
          }),
          'test-operation-id-3': Operation({
            opId: 'test-operation-id-3',
            txId: 'transaction-id-3',
            type: operationTypes.pendingDirectMessage,
            meta: PendingDirectMessageOp({
              message: Immutable.fromJS(testUtils.createMessage(
                'test-message-id-3',
                testUtils.now.minus({ hours: 5 }).toSeconds()
              )),
              recipientAddress: identity1.address,
              recipientUsername
            }),
            status: 'success'
          })
        })
      })
    })
    jest.clearAllMocks()
  })

  it(' - contacts', () => {
    expect(selectors.contacts(store.getState())).toMatchSnapshot()
  })

  it(' - contact', () => {
    expect(selectors.contact(identity1.address)(store.getState())).toMatchSnapshot()
  })

  it(' - messages', () => {
    expect(selectors.messages(identity1.address)(store.getState())).toMatchSnapshot()
  })
  it(' - newMessages', () => {
    expect(selectors.newMessages(identity1.address)(store.getState())).toMatchSnapshot()
  })

  it(' - lastSeen', () => {
    expect(selectors.lastSeen(identity1.address)(store.getState())).toMatchSnapshot()
  })

  it(' - pending messages', () => {
    expect(selectors.pendingMessages(identity1.address)(store.getState())).toMatchSnapshot()
  })

  it(' - queue messages', () => {
    expect(selectors.queuedMessages(identity1.address)(store.getState())).toMatchSnapshot()
  })

  it(' - vault messages', () => {
    expect(selectors.vaultMessages(identity1.address)(store.getState())).toMatchSnapshot()
  })

  it(' - direct messages', () => {
    expect(selectors.directMessages(identity1.address)(store.getState())).toMatchSnapshot()
  })
})
