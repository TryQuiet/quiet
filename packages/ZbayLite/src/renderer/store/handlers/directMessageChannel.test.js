/* eslint import/first: 0 */
import create from '../create'
import { DirectMessageChannelState, actions } from './directMessageChannel'
import directMessageChannel from '../selectors/directMessageChannel'

describe('directMessageChannel reducer', () => {
  let store = null
  beforeEach(async () => {
    store = create({
      initialState: {
        directMessageChannel: {
          ...DirectMessageChannelState
        }
      }
    })
  })

  describe('handles actions', () => {
    it('- setTargetRecipientAddress', () => {
      store.dispatch(actions.setDirectMessageRecipientAddress('target-user-address'))
      const channel = directMessageChannel.directMessageChannel(store.getState())
      expect(channel).toMatchSnapshot()
    })

    it('- setTargetRecipientUsername', () => {
      store.dispatch(actions.setDirectMessageRecipientUsername('target-user-username'))
      const channel = directMessageChannel.directMessageChannel(store.getState())
      expect(channel).toMatchSnapshot()
    })
  })
})
