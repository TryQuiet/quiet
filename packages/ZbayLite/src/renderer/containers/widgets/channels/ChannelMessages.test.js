import React from 'react'
import BigNumber from 'bignumber.js'
import * as R from 'ramda'
import { shallow } from 'enzyme'

import ChannelMessages from './ChannelMessages'
import { Provider } from 'react-redux'

import { createReceivedMessage, now } from '../../../testUtils'
import create from '../../../store/create'
import { ChannelState } from '../../../store/handlers/channel'
import { ReceivedMessage } from '../../../store/handlers/messages'

describe('ChannelInput', () => {
  let store = null
  beforeEach(() => {
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
      messages: {
        [channelId]: {
          messages: R.range(0, 4).map(id => {
            return {
              ...ReceivedMessage,
              ...createReceivedMessage({
                id,
                createdAt: now.minus({ hours: 2 * id }).toSeconds()
              })
            }
          })
        }
      }
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
