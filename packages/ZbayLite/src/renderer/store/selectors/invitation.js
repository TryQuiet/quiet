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
const amountZec = createSelector(
  invitation,
  state => state.get('amountZec')
)
const affiliateCode = createSelector(
  invitation,
  state => state.get('affiliateCode')
)
const generatedInvitation = createSelector(
  invitation,
  state => state.get('generatedInvitation')
)

export default {
  invitation,
  amount,
  affiliateCode,
  generatedInvitation,
  amountZec
}
