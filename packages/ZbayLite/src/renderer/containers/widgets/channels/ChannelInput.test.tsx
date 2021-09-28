import BigNumber from 'bignumber.js'
import { renderHook } from '@testing-library/react-hooks'
import React from 'react'
import { useChannelInputData, useChannelInputActions } from './ChannelInput'

import { Provider } from 'react-redux'

import create from '../../../store/create'
import { ChannelState } from '../../../store/handlers/channel'
import { createChannel } from '../../../testUtils'

const channelId = 1234
describe('ChannelInput', () => {
  let store, wrapper

  beforeEach(() => {
    jest.clearAllMocks()
    store = create({
      channel: {
        ...ChannelState,
        spentFilterValue: 38,
        name: 'Politics',
        members: new BigNumber(0),
        message: 'This is a test message',
        messages: [],
        id: channelId
      },
      channels: {
        data: [createChannel(channelId)]
      }
    })
    wrapper = ({ children }) => <Provider store={store}>{children}</Provider>
  })

  it('will receive right props', async () => {
    const { result } = renderHook(() => useChannelInputData(), { wrapper })
    expect(result.current).toMatchSnapshot()
  })

  it('will receive right actions', async () => {
    const { result } = renderHook(() => useChannelInputActions(), { wrapper })
    expect(result.current).toMatchSnapshot()
  })
})
