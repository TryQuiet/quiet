import React from 'react'
import { renderHook } from '@testing-library/react-hooks'
import { Provider } from 'react-redux'
import { useChannelMessageData } from './ChannelMessage'

describe('ChannelMessage', () => {
  let store, wrapper
  beforeEach(() => {
    jest.clearAllMocks()

    wrapper = ({ children }) => <Provider store={store}>{children}</Provider>
  })

  it('will receive right props', async () => {
    const { result } = renderHook(() => useChannelMessageData(), { wrapper })
    expect(result.current).toMatchSnapshot()
  })
})
