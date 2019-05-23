/* eslint import/first: 0 */
import Immutable from 'immutable'

import create from '../create'
import { PendingMessage } from '../handlers/pendingMessages'
import selectors from './pendingMessages'
import { createMessage } from '../../testUtils'

describe('pending messages selectors selectors', () => {
  let store = null
  beforeEach(() => {
    store = create({
      initialState: Immutable.Map({
        pendingMessages: Immutable.fromJS({
          'test-operation-id': PendingMessage({
            opId: 'test-operation-id',
            channelId: 'test-channel-id',
            txId: 'transaction-id',
            message: Immutable.fromJS(createMessage('test-message-id')),
            status: 'success'
          })
        })
      })
    })
    jest.clearAllMocks()
  })

  it('pendingMessages', () => {
    expect(selectors.pendingMessages(store.getState())).toMatchSnapshot()
  })
})
