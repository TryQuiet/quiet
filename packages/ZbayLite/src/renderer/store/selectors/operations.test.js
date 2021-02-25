/* eslint import/first: 0 */
import BigNumber from 'bignumber.js'

import create from '../create'
import { Operation, ShieldBalanceOp, PendingMessageOp, OperationTypes } from '../handlers/operations'
import selectors from './operations'
import { createMessage } from '../../testUtils'

describe('operations selectors', () => {
  let store = null
  beforeEach(() => {
    store = create({
      operations: {
        'test-operation-id': {
          ...Operation,
          opId: 'test-operation-id',
          type: OperationTypes.shieldBalance,
          txId: 'transaction-id',
          meta: {
            ...ShieldBalanceOp,
            amount: new BigNumber('234.14324'),
            from: 'from-address',
            to: 'to-address'
          },
          status: 'success'
        },
        'test-operation-id-1': {
          ...Operation,
          opId: 'test-operation-id',
          type: OperationTypes.pendingMessage,
          meta: {
            ...PendingMessageOp,
            message: createMessage('test-message-id'),
            channelId: 'test-channel-id'
          },
          txId: 'transaction-id',
          status: 'success'
        }
      }
    })
    jest.clearAllMocks()
  })

  it(' - operations', () => {
    expect(selectors.operations(store.getState())).toMatchSnapshot()
  })
})
