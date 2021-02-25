/* eslint import/first: 0 */
import create from '../create'
import { initialState as RatesState } from '../handlers/rates'
import selectors from './rates'
import each from 'jest-each'

describe('rates selectors', () => {
  let store = null
  beforeEach(() => {
    store = create({
      rates: {
        ...RatesState,
        zec: '132.343459',
        usd: '232.11'
      }
    })
    jest.clearAllMocks()
  })

  each(['usd', 'zec']).test('fetches rates for %s', currency => {
    expect(selectors.rate(currency)(store.getState())).toMatchSnapshot()
  })
  it('selects feeUsd', async () => {
    expect(selectors.feeUsd(store.getState())).toMatchSnapshot()
  })
})
