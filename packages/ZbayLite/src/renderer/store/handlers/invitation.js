import Immutable from 'immutable'
import { createAction, handleActions } from 'redux-actions'

export const Invitation = Immutable.Record(
  {
    amount: 0,
    affiliateCode: false
  },
  'Invitation'
)

export const initialState = Invitation()

const setInvitationAmount = createAction('SET_INVITATION_AMOUNT')
const setAffiliateCode = createAction('SET_AFFILIATE_CODE')
const resetInvitation = createAction('RESET_INVITATION')

export const actions = {
  setInvitationAmount,
  setAffiliateCode,
  resetInvitation
}

export const reducer = handleActions(
  {
    [setInvitationAmount]: (state, { payload: amount }) => state.set('amount', amount),
    [resetInvitation]: state => initialState,
    [setAffiliateCode]: (state, { payload: affiliateCode }) =>
      state.set('affiliateCode', affiliateCode)
  },
  initialState
)

export default {
  actions,
  reducer
}
