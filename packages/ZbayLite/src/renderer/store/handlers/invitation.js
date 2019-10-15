import Immutable from 'immutable'
import * as Yup from 'yup'
import { createAction, handleActions } from 'redux-actions'
import BigNumber from 'bignumber.js'

import invitationSelector from '../selectors/invitation'
import identitySelectors from '../selectors/identity'
import ratesSelectors from '../selectors/rates'
import { getClient } from '../../zcash'
import nodeHandlers from './node'
import identityHandlers from './identity'
import { deflate, inflate } from '../../compression'
import { messages } from '../../zbay'
import { donationTarget } from '../../zcash/donation'
import { actionCreators } from './modals'

export const URI_PREFIX = 'zbay://'

export const getInvitationUrl = invitation =>
  `${URI_PREFIX}?invitation=${encodeURIComponent(invitation)}`

export const Invitation = Immutable.Record(
  {
    amount: 0,
    affiliateCode: false,
    generatedInvitation: ''
  },
  'Invitation'
)

export const initialState = Invitation()

const setInvitationAmount = createAction('SET_INVITATION_AMOUNT')
const setAffiliateCode = createAction('SET_AFFILIATE_CODE')
const resetInvitation = createAction('RESET_INVITATION')
const setGeneratedInvitation = createAction('SET_GENERATED_INVITATION')

export const actions = {
  setInvitationAmount,
  setAffiliateCode,
  resetInvitation,
  setGeneratedInvitation
}

export const generateInvitation = () => async (dispatch, getState) => {
  const amount = invitationSelector.amount(getState())
  const includeAffiliate = invitationSelector.affiliateCode(getState())
  const identityAddress = identitySelectors.address(getState())
  const zecRate = ratesSelectors.rate('usd')(getState())
  let donationAddress
  if (includeAffiliate) {
    donationAddress = identityAddress
  } else {
    donationAddress = donationTarget
  }
  if (parseFloat(amount) > 0) {
    const { value: address } = await dispatch(nodeHandlers.actions.createAddress())
    const sk = await getClient().keys.exportSK(address)
    const transfer = messages.createEmptyTransfer({
      address,
      amount: new BigNumber(amount / zecRate).toFixed(8).toString(), // TODO change to real amount for production
      identityAddress
    })
    await getClient().payment.send(transfer)
    const invitation = await deflate({ sk, address, donationAddress })
    const invitationUrl = getInvitationUrl(invitation)
    await dispatch(setGeneratedInvitation(invitationUrl))
  } else {
    const invitation = await deflate({ donationAddress })
    const invitationUrl = getInvitationUrl(invitation)
    await dispatch(setGeneratedInvitation(invitationUrl))
  }
}

const invitationSchema = Yup.object().shape({
  donationAddress: Yup.string().required(),
  address: Yup.string(),
  sk: Yup.string()
})

export const handleInvitation = invitationPacked => async (dispatch, getState) => {
  try {
    const identityAddress = identitySelectors.address(getState())
    const invitation = await inflate(invitationPacked)
    await invitationSchema.validate(invitation)
    if (invitation.sk) {
      await getClient().keys.importSK({ sk: invitation.sk })
      const amount = await getClient().accounting.balance(invitation.address)
      if (amount.gt(0.0001)) {
        const transfer = messages.createEmptyTransfer({
          address: identityAddress,
          amount: amount.minus(0.0001).toString(),
          identityAddress: invitation.address
        })
        await getClient().payment.send(transfer)
      }
    }
    await dispatch(identityHandlers.epics.updateDonationAddress(invitation.donationAddress))
    dispatch(actionCreators.openModal('receivedInvitationModal')())
  } catch (err) {
    dispatch(actionCreators.openModal('receivedInvitationModal', { err: 'Error, try again' })())
  }
}
export const epics = {
  generateInvitation,
  handleInvitation
}
export const reducer = handleActions(
  {
    [setInvitationAmount]: (state, { payload: amount }) => state.set('amount', amount),
    [setGeneratedInvitation]: (state, { payload: invitation }) =>
      state.set('generatedInvitation', invitation),
    [resetInvitation]: state => initialState,
    [setAffiliateCode]: (state, { payload: affiliateCode }) =>
      state.set('affiliateCode', affiliateCode)
  },
  initialState
)

export default {
  actions,
  reducer,
  epics
}
