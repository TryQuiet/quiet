/* eslint import/first: 0 */
jest.mock('../../vault')
import Immutable from 'immutable'
import BigNumber from 'bignumber.js'
import * as R from 'ramda'

import channelSelectors from './channel'

import create from '../create'
import { ChannelState, MessagesState } from '../handlers/channel'
import { ChannelsState } from '../handlers/channels'
import { createMessage, createChannel } from '../../testUtils'

describe('Channel selector', () => {
  const channelId = 'this-is-a-test-id'

  let store = null
  beforeEach(() => {
    jest.clearAllMocks()
    store = create({
      initialState: Immutable.Map({
        channel: ChannelState({
          spentFilterValue: 38,
          id: channelId,
          members: new BigNumber(0),
          message: 'Message written in the input',
          messages: MessagesState({
            data: Immutable.fromJS(R.range(0, 4).map(createMessage))
          })
        }),
        channels: ChannelsState({
          data: Immutable.fromJS([createChannel(channelId)])
        })
      })
    })
  })

  it('channel selector', async () => {
    expect(channelSelectors.channel(store.getState())).toMatchSnapshot()
  })

  it('spent filter value selector', async () => {
    expect(channelSelectors.spentFilterValue(store.getState())).toMatchSnapshot()
  })

  it('message selector', async () => {
    expect(channelSelectors.message(store.getState())).toMatchSnapshot()
  })

  it('messages selector', async () => {
    expect(channelSelectors.messages(store.getState())).toMatchSnapshot()
  })

  it('data selector', async () => {
    expect(channelSelectors.data(store.getState())).toMatchSnapshot()
  })
})
