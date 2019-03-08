import BigNumber from 'bignumber.js'
import { createSelector } from 'reselect'

import { rate } from './rates'

const store = s => s

const identity = createSelector(store, state => state.get('identity'))

const balance = currency => createSelector(
  identity,
  rate(currency),
  (i, rate) => rate.times(new BigNumber(i.get('balance', 0))) // use big number
)

export default {
  identity,
  balance
}
