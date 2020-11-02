import { createSelector } from 'reselect'

const store = s => s

const invitation = createSelector(
  store,
  state => state.invitation
)
const amount = createSelector(
  invitation,
  state => state.amount
)
const amountZec = createSelector(
  invitation,
  state => state.amountZec
)
const affiliateCode = createSelector(
  invitation,
  state => state.affiliateCode
)
const generatedInvitation = createSelector(
  invitation,
  state => state.generatedInvitation
)

export default {
  invitation,
  amount,
  affiliateCode,
  generatedInvitation,
  amountZec
}
