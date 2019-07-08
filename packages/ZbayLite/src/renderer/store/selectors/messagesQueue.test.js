/* eslint import/first: 0 */
import Immutable from 'immutable'

import create from '../create'
import { PendingMessage } from '../handlers/messagesQueue'
import selectors from './messagesQueue'
import { createMessage } from '../../testUtils'

describe('operations selectors', () => {
  let store = null
  beforeEach(() => {
    store = create({
      initialState: Immutable.Map({
        messagesQueue: Immutable.fromJS({
          'messageHash': PendingMessage({
            channelId: 'test-channel-id-1',
            message: Immutable.fromJS(createMessage(1))
          }),
          'messageHash2': PendingMessage({
            channelId: 'test-channel-id-1',
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
