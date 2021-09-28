import { useData } from './IdentityPanel'

import React from 'react'
import { renderHook } from '@testing-library/react-hooks'
import { Provider } from 'react-redux'

import create from '../../store/create'
import { initialState } from '../../store/handlers/identity'

describe('IdentityPanel', () => {
  let store = null
  let wrapper
  beforeEach(() => {
    jest.clearAllMocks()
    store = create({
      identity: {
        ...initialState,
        data: {
          ...initialState.data,
          address: 'zctestaddress',
          balance: '23.435432',
          lockedBalance: '13.123432',
          name: 'saturn'
        }
      }
    })
    wrapper = ({ children }) => <Provider store={store}>{children}</Provider>
  })

  it('will receive right props', async () => {
    const { result } = renderHook(() => useData(), { wrapper })
    expect(result.current).toMatchSnapshot()
  })
})
