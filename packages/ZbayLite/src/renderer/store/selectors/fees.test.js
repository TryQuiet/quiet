/* eslint import/first: 0 */
import Immutable from 'immutable'

import selectors from './fees'
import { Fee } from '../handlers/fees'

import create from '../create'

describe('app -', () => {
  let store = null
  beforeEach(() => {
    jest.clearAllMocks()
    store = create({
      initialState: Immutable.Map({
        fees: Fee({
          user: 0.1,
          publicChannel: 0.01
        })
      })
    })
  })

  it('userFee selector', async () => {
    expect(selectors.userFee(store.getState())).toEqual(0.1)
  })
  it('publicChannelfee transfers', async () => {
    expect(selectors.publicChannelfee(store.getState())).toEqual(0.01)
  })
})
