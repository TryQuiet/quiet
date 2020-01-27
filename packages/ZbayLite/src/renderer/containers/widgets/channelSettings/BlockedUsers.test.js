/* eslint import/first: 0 */
import Immutable from 'immutable'
import BigNumber from 'bignumber.js'

import { mapDispatchToProps, mapStateToProps } from './BlockedUsers'

import { ChannelState } from '../../../store/handlers/channel'
import { ChannelsState } from '../../../store/handlers/channels'
import { createChannel } from '../../../testUtils'
import { ChannelMessages } from '../../../store/handlers/messages'

import create from '../../../store/create'

const messages = [
  {
    createdAt: 1567683687,
    id: 'test-1',
    type: 6,
    message: {
      minFee: '100',
      onlyRegistered: '1',
      owner: '03638eb7aaae341acf66db8b79c9b31e3627715d8bf1795b87e817bda45cc80d'
    },
    publicKey: '03638eb7aaae341acf66db8b79c9b31e3627715d8bf1795b87e817bda45cc80d',
    sender: {
      replyTo: '',
      username: 'test123'
    }
  },
  {
    createdAt: 1567683647,
    id: 'test-1',
    type: 7,
    message: {
      moderationType: 'BLOCK_USER',
      moderationTarget: 'new-blocked-user-public-key-added-by-channel-owner'
    },
    publicKey: '03638eb7aaae341acf66db8b79c9b31e3627715d8bf1795b87e817bda45cc80d',
    sender: {
      replyTo: '',
      username: 'test123'
    }
  }
]
const channelId = 'randomid'
const baseStore = {
  channel: ChannelState({
    spentFilterValue: 38,
    id: channelId,
    shareableUri: 'testuri',
    members: new BigNumber(0),
    message: 'Message written in the input'
  }),
  channels: ChannelsState({
    data: Immutable.fromJS([createChannel(channelId)])
  })
}
describe('Send message popover', () => {
  let store = null
  beforeEach(() => {
    jest.clearAllMocks()
    store = create({
      initialState: Immutable.Map({
        ...baseStore,
        messages: Immutable.Map({
          [channelId]: ChannelMessages({
            messages: Immutable.List(Immutable.fromJS(messages))
          })
        })
      })
    })
  })

  it('will receive right props', () => {
    const state = mapStateToProps(store.getState())
    expect(state).toMatchSnapshot()
  })

  it('will receive right actions', () => {
    const actions = mapDispatchToProps(x => x)
    expect(actions).toMatchSnapshot()
  })
})
