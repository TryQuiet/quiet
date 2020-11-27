import BigNumber from 'bignumber.js'
import { createSelector } from 'reselect'
import { networkFee } from '../../../shared/static'

import { Store } from '../reducers'

const rates = (s: Store) => s.rates

export const rate = currency =>
  createSelector(rates, r => new BigNumber(r[currency] || 0))
export const history = createSelector(rates, r => r.history)
export const priceByTime = time =>
  createSelector(history, h => {
    const closesTransaction = Array.from(Object.values(h)).reduce((prev, curr) => {
      return Math.abs(curr.datetime - time) < Math.abs(prev.datetime - time)
        ? curr
        : prev
    })
    return parseFloat(closesTransaction.price)
  })

export const feeUsd = createSelector(rates, r => {
  return parseFloat(((Number(r.usd) || 0) * networkFee).toFixed(4))
}
)

export default {
  rate,
  feeUsd,
  priceByTime,
  history
}
