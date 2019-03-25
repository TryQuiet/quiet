/* eslint import/first: 0 */
jest.mock('../../vault')
import Immutable from 'immutable'
import BigNumber from 'bignumber.js'
import * as R from 'ramda'

import channelSelectors from './channel'

import create from '../create'
import { ChannelState } from '../handlers/channel'
import { createMessage } from '../../components/widgets/channels/testUtils'

describe('ChannelHeader', () => {
  let store = null
  beforeEach(() => {
    jest.clearAllMocks()
    store = create({
      initialState: Immutable.Map({
        channel: ChannelState({
          spentFilterValue: 38,
          name: 'Politics',
          members: new BigNumber(0),
          message: 'Message written in the input',
          messages: R.range(0, 4).map(createMessage)
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
})
