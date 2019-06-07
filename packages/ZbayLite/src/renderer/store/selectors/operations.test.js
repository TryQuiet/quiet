/* eslint import/first: 0 */
import Immutable from 'immutable'
import BigNumber from 'bignumber.js'

import create from '../create'
import { Operation, ShieldBalanceOp, PendingMessageOp, operationTypes } from '../handlers/operations'
import selectors from './operations'
import { createMessage } from '../../testUtils'

describe('operations selectors', () => {
  let store = null
  beforeEach(() => {
    store = create({
      initialState: Immutable.Map({
        operations: Immutable.fromJS({
          'test-operation-id': Operation({
            opId: 'test-operation-id',
            type: operationTypes.shieldBalance,
            txId: 'transaction-id',
            meta: ShieldBalanceOp({
              amount: new BigNumber('234.14324'),
              from: 'from-address',
              to: 'to-address'
            }),
            status: 'success'
          }),
          'test-operation-id-1': Operation({
            opId: 'test-operation-id',
            type: operationTypes.pendingMessage,
            meta: PendingMessageOp({
              message: Immutable.fromJS(createMessage('test-message-id')),
              channelId: 'test-channel-id'
            }),
            txId: 'transaction-id',
            status: 'success'
          })
        })
      })
    })
    jest.clearAllMocks()
  })

  it(' - operations', () => {
    expect(selectors.operations(store.getState())).toMatchSnapshot()
  })

  it(' - pendingMessages', () => {
    expect(selectors.pendingMessages(store.getState())).toMatchSnapshot()
  })
})
