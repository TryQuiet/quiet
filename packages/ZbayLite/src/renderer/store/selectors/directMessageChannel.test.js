/* eslint import/first: 0 */
jest.mock('../../vault')
import Immutable from 'immutable'

import { directMessageChannel } from './directMessageChannel'
import create from '../create'
import { DirectMessageChannelState } from '../handlers/directMessageChannel'

const storeState = {
  directMessageChannel: DirectMessageChannelState({
    targetRecipientAddress: 'test-address',
    targetRecipientUsername: 'test-username'
  })
}

describe('directMessageChannel selector', () => {
  let store = null
  beforeEach(() => {
    jest.clearAllMocks()
    store = create({
      initialState: Immutable.Map(storeState)
    })
  })

  it('channel data selector', async () => {
    expect(directMessageChannel(store.getState())).toMatchSnapshot()
  })
})
