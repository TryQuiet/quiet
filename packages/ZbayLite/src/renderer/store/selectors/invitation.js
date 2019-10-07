import { createSelector } from 'reselect'

const store = s => s

const invitation = createSelector(
  store,
  state => state.get('invitation')
)
const amount = createSelector(
  invitation,
  state => state.get('amount')
)
const affiliateCode = createSelector(
  invitation,
  state => state.get('affiliateCode')
)

export default {
  invitation,
  amount,
  affiliateCode
}
