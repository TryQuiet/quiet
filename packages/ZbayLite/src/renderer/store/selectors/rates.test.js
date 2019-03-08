/* eslint import/first: 0 */
jest.mock('../../vault')
import Immutable from 'immutable'

import create from '../create'
import { RatesState } from '../handlers/rates'
import selectors from './rates'

describe('rates selectors', () => {
  let store = null
  beforeEach(() => {
    store = create({
      initialState: Immutable.Map({
        rates: RatesState({
          zec: '132.343459',
          usd: '232.11'
        })
      })
    })
    jest.clearAllMocks()
  })

  each(['usd', 'zec']).test(
    'fetches rates for %s',
    (currency) => {
      expect(selectors.rate(currency)(store.getState())).toMatchSnapshot()
    }
  )
})
