import React from 'react'
import BigNumber from 'bignumber.js'
import * as R from 'ramda'
import { shallow } from 'enzyme'

import ChannelMessages from './ChannelMessages'
import { Provider } from 'react-redux'

import { createMessage } from '../../../testUtils'
import create from '../../../store/create'
import { ChannelState } from '../../../store/handlers/channel'

describe('ChannelInput', () => {
  let store = null
  beforeEach(async () => {
    const message = await createMessage()
    jest.clearAllMocks()
    const channelId = 'this-is-test-channel-id'
    store = create({
      channel: {
        ...ChannelState,
        spentFilterValue: 38,
        id: channelId,
        members: new BigNumber(0),
        message: 'This is a test message'
      },
      messages: [message]
    })
  })

  it('will receive right props for channel', async () => {
    const result = shallow(
      <Provider store={store}>
        <ChannelMessages tab={0} contentRect={jest.fn()} />
      </Provider>
    )
  })
})
