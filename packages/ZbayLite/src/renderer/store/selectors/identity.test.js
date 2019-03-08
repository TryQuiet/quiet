/* eslint import/first: 0 */
jest.mock('../../vault')
import Immutable from 'immutable'

import create from '../create'
import { IdentityState } from '../handlers/identity'
import { RatesState } from '../handlers/rates'
import selectors from './identity'

describe('identity selectors', () => {
  let store = null
  beforeEach(() => {
    store = create({
      initialState: Immutable.Map({
        identity: IdentityState({
          address: 'zs1z7rejlpsa98s2rrrfkwmaxu53e4ue0ulcrw0h4x5g8jl04tak0d3mm47vdtahatqrlkngh9sly',
          name: 'Saturn',
          balance: '33.583004'
        }),
        rates: RatesState({
          zec: '1',
          usd: '2'
        })
      })
    })
    jest.clearAllMocks()
  })

  it('identity', () => {
    expect(selectors.identity(store.getState())).toMatchSnapshot()
  })

  each(['usd', 'zec']).test(
    'balance for %s',
    (currency) => {
      expect(selectors.balance(currency)(store.getState())).toMatchSnapshot()
    }
  )
})
