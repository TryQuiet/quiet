import BigNumber from 'bignumber.js'
import { createSelector } from 'reselect'
import { networkFee } from '../../../shared/static'
const store = s => s

const rates = createSelector(store, state => state.get('rates'))

export const rate = currency =>
  createSelector(rates, r => new BigNumber(r.get(currency, 0)))

export const feeUsd = createSelector(rates, r =>
  parseFloat(r.get('usd', 0) * networkFee).toFixed(4)
)

export default {
  rate,
  feeUsd
}
