import Immutable from 'immutable'

import create from '../create'
import { actions, initialState } from './rates'
import selectors from '../selectors/rates'

describe('Operations reducer handles ', () => {
  let store = null

  beforeEach(() => {
    store = create({
      initialState: Immutable.Map({
        rates: initialState
      })
    })
    jest.clearAllMocks()
  })

  describe('actions', () => {
    it('- addOperation', () => {
      store.dispatch(actions.setPriceUsd({ priceUsd: 50 }))
      expect(selectors.rate('usd')(store.getState())).toMatchSnapshot()
    })
  })
})
