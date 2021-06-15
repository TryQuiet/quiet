/* eslint import/first: 0 */
import { useChannelActions } from './Channel'
import { renderHook } from '@testing-library/react-hooks'
import { Provider } from 'react-redux'
import React from 'react'
import create from '../../store/create'
describe('Channel page', () => {
  let wrapper, store
  beforeEach(() => {
    store = create({})
    jest.clearAllMocks()
    wrapper = ({ children }) => <Provider store={store}>{children}</Provider>
  })

  it('will receive right actions', async () => {
    const { result } = renderHook(() => useChannelActions(), { wrapper })
    expect(result.current).toMatchSnapshot()
  })
})
