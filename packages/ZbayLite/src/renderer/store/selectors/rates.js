import BigNumber from 'bignumber.js'
import { createSelector } from 'reselect'

const store = s => s

const rates = createSelector(store, state => state.get('rates'))

export const rate = currency => createSelector(rates, r => new BigNumber(r.get(currency, 0)))

export default {
  rate
}
