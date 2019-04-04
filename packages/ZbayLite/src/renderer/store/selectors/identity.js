import BigNumber from 'bignumber.js'
import { createSelector } from 'reselect'

import { rate } from './rates'

const store = s => s

const identity = createSelector(store, state => state.get('identity'))

const data = createSelector(identity, i => i.data)

const balance = currency => createSelector(
  data,
  rate(currency),
  (d, rate) => rate.times(new BigNumber(d.balance || 0))
)

const address = createSelector(data, d => d.address)

export default {
  data,
  identity,
  address,
  balance
}
