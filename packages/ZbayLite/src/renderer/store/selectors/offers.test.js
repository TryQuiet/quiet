/* eslint import/first: 0 */
jest.mock('../../vault')
import Immutable from 'immutable'
import * as R from 'ramda'
import { DateTime } from 'luxon'

import offersSelectors from './offers'

import create from '../create'
import offersHandlers, { Offer } from '../handlers/offers'
import testUtils from '../../testUtils'
import { ReceivedMessage } from '../handlers/messages'
import { PendingMessage } from '../handlers/directMessagesQueue'
import { operationTypes, PendingDirectMessageOp, Operation } from '../handlers/operations'

const [identity1] = testUtils.identities
const recipientUsername = 'test-recipient-username'

describe('Channels selectors', () => {
  let store = null
  beforeEach(() => {
    jest.clearAllMocks()
    store = create({
      initialState: Immutable.Map({
        offers: Immutable.Map({
          test1: Offer({
            address: 'testAddress',
            itemId: 'testID',
            name: 'testname',
            lastSeen: '123',
            messages: Immutable.List(
              R.range(0, 2).map(id =>
                ReceivedMessage(
                  testUtils.messages.createReceivedMessage({
                    id,
                    createdAt: testUtils.now.minus({ hours: 2 * id }).toSeconds(),
                    sender: identity1
                  })
                )
              )
            ),
            newMessages: Immutable.List(['123', '1234'])
          })
        }),
        directMessagesQueue: Immutable.Map({
          'messageHash': PendingMessage({
            recipientAddress: identity1.address,
            recipientUsername,
            offerId: 'test1',
            message: Immutable.fromJS(
              testUtils.createItemMessage('test-pending-message', testUtils.now.minus({ hours: 2 }).toSeconds())
            )
          })
        }),
        operations: Immutable.fromJS({
          'test-operation-id': Operation({
            opId: 'test-operation-id',
            txId: 'transaction-id',
            type: operationTypes.pendingDirectMessage,
            meta: PendingDirectMessageOp({
              message: Immutable.fromJS(testUtils.createItemMessage(
                'test-message-id',
                testUtils.now.minus({ hours: 1 }).toSeconds()
              )),
              recipientAddress: identity1.address,
              recipientUsername,
              offerId: 'test1'
            }),
            status: 'success'
          }),
          'test-operation-id-2': Operation({
            opId: 'test-operation-id-2',
            txId: 'transaction-id-2',
            type: operationTypes.pendingDirectMessage,
            meta: PendingDirectMessageOp({
              message: Immutable.fromJS(testUtils.createItemMessage(
                'test-message-id-2',
                testUtils.now.minus({ hours: 3 }).toSeconds()
              )),
              recipientAddress: identity1.address,
              recipientUsername,
              offerId: 'test1'
            }),
            status: 'success'
          }),
          'test-operation-id-3': Operation({
            opId: 'test-operation-id-3',
            txId: 'transaction-id-3',
            type: operationTypes.pendingDirectMessage,
            meta: PendingDirectMessageOp({
              message: Immutable.fromJS(testUtils.createItemMessage(
                'test-message-id-3',
                testUtils.now.minus({ hours: 5 }).toSeconds()
              )),
              recipientAddress: identity1.address,
              recipientUsername,
              offerId: 'test1'
            }),
            status: 'success'
          })
        })
      })
    })
  })

  it('- offers', async () => {
    expect(offersSelectors.offers(store.getState())).toMatchSnapshot()
  })
  it('- offer messages', async () => {
    expect(offersSelectors.offerMessages('test1')(store.getState())).toMatchSnapshot()
  })

  it('- offer by id', async () => {
    const channel = offersSelectors.offer('test1')(store.getState())
    expect(channel).toMatchSnapshot()
  })

  it('- lastSeen', () => {
    const now = DateTime.utc()
    store.dispatch(
      offersHandlers.actions.setLastSeen({
        itemId: 'test1',
        lastSeen: now.minus({ years: 2 })
      })
    )

    const updated = offersSelectors.lastSeen('test1')(store.getState())
    expect(updated).toEqual(now.minus({ years: 2 }))
  })
})
