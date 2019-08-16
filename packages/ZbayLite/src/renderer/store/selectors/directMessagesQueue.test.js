/* eslint import/first: 0 */
import Immutable from 'immutable'

import create from '../create'
import { PendingMessage } from '../handlers/directMessagesQueue'
import selectors from './directMessagesQueue'
import { createMessage } from '../../testUtils'

describe('operations selectors', () => {
  let store = null
  beforeEach(() => {
    store = create({
      initialState: Immutable.Map({
        messagesQueue: Immutable.fromJS({
          'messageHash': PendingMessage({
            recipientAddress: 'test-address',
            recipientUsername: 'test-username',
            message: Immutable.fromJS(createMessage(1))
          }),
          'messageHash2': PendingMessage({
            recipientAddress: 'test-address',
            recipientUsername: 'test-username',
            message: Immutable.fromJS(createMessage(1))
          })
        })
      })
    })
    jest.clearAllMocks()
  })

  it(' - queue', () => {
    expect(selectors.queue(store.getState())).toMatchSnapshot()
  })
})
