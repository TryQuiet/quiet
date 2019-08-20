/* eslint import/first: 0 */

import Immutable from 'immutable'

import create from '../create'
import { DirectMessageChannelState, actions } from './directMessageChannel'
import { directMessageChannel } from '../selectors/directMessageChannel'

describe('directMessageChannel reducer', () => {
  let store = null
  beforeEach(async () => {
    store = create({
      initialState: Immutable.Map({
        directMessageChannel: DirectMessageChannelState()
      })
    })
  })

  describe('handles actions', () => {
    it('- setTargetRecipientAddress', () => {
      store.dispatch(actions.setDirectMessageRecipientAddress('target-user-address'))
      const channel = directMessageChannel(store.getState())
      expect(channel).toMatchSnapshot()
    })

    it('- setTargetRecipientUsername', () => {
      store.dispatch(actions.setDirectMessageRecipientUsername('target-user-username'))
      const channel = directMessageChannel(store.getState())
      expect(channel).toMatchSnapshot()
    })
  })
})
