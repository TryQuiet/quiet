
import BigNumber from 'bignumber.js'
import { renderHook } from '@testing-library/react-hooks'
import React from 'react'
import { Provider } from 'react-redux'
import { useDirectMessageInputActions, useDirectMessageInputData } from './DirectMessageInput'

import create from '../../../store/create'
import { ChannelState } from '../../../store/handlers/channel'

describe('ChannelInput', () => {
  let store; let wrapper = null
  beforeEach(() => {
    jest.clearAllMocks()
    store = create({
      channel: {
        ...ChannelState,
        spentFilterValue: 38,
        name: 'Politics',
        members: new BigNumber(0),
        message: 'This is a test message',
        messages: []
      }
    })
    wrapper = ({ children }) => <Provider store={store}>{children}</Provider>
  })

  it('will receive right props', async () => {
    const { result } = renderHook(() => useDirectMessageInputData(), { wrapper })
    expect(result.current).toMatchSnapshot()
  })

  it('will receive right actions', async () => {
    const { result } = renderHook(() => useDirectMessageInputActions(), { wrapper })
    expect(result.current).toMatchSnapshot()
  })
})
