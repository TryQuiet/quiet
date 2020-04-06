import Immutable from 'immutable'
import * as Yup from 'yup'
import { createAction, handleActions } from 'redux-actions'
import BigNumber from 'bignumber.js'

import invitationSelector from '../selectors/invitation'
import identitySelectors from '../selectors/identity'
import logsHandlers from '../handlers/logs'
import ratesSelectors from '../selectors/rates'
import { getClient } from '../../zcash'
import nodeHandlers from './node'
import identityHandlers from './identity'
import { deflate, inflate } from '../../compression'
import { messages } from '../../zbay'
import { donationTarget } from '../../zcash/donation'
import { actionCreators } from './modals'
import { DOMAIN, networkFee, actionTypes } from '../../../shared/static'
import nodeSelectors from '../selectors/node'

export const getInvitationUrl = invitation =>
  `https://${DOMAIN}/invitation=${encodeURIComponent(invitation)}`

export const Invitation = Immutable.Record(
  {
    amount: 0,
    amountZec: 0,
    affiliateCode: true,
    generatedInvitation: ''
  },
  'Invitation'
)

export const initialState = Invitation()

const setInvitationAmount = createAction(actionTypes.SET_INVITATION_AMOUNT)
const setInvitationAmountZec = createAction(actionTypes.SET_INVITATION_AMOUNT_ZEC)
const setAffiliateCode = createAction(actionTypes.SET_AFFILIATE_CODE)
const resetInvitation = createAction(actionTypes.RESET_INVITATION)
const setGeneratedInvitation = createAction(actionTypes.SET_GENERATED_INVITATION)

export const actions = {
  setInvitationAmount,
  setAffiliateCode,
  resetInvitation,
  setGeneratedInvitation,
  setInvitationAmountZec
}

export const generateInvitation = () => async (dispatch, getState) => {
  dispatch(logsHandlers.epics.saveLogs({ type: 'APPLICATION_LOGS', payload: `Creating new invitation` }))
  const amountUsd = invitationSelector.amount(getState())
  const amountZec = invitationSelector.amountZec(getState())
  const includeAffiliate = invitationSelector.affiliateCode(getState())
  const identityAddress = identitySelectors.address(getState())
  const zecRate = ratesSelectors.rate('usd')(getState())
  const amount =
    amountZec || new BigNumber(amountUsd / zecRate).toFixed(8).toString()
  let donationAddress
  if (includeAffiliate) {
    donationAddress = identityAddress
  } else {
    donationAddress = donationTarget
  }
  if (parseFloat(amount) > 0) {
    const { value: address } = await dispatch(
      nodeHandlers.actions.createAddress()
    )
    const sk = await getClient().keys.exportSK(address)
    const transfer = messages.createEmptyTransfer({
      address,
      amount: amount, // TODO change to real amount for production
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
  await dispatch(setInvitationAmount((amount * zecRate).toFixed(2)))
}

const invitationSchema = Yup.object().shape({
  donationAddress: Yup.string().required(),
  address: Yup.string(),
  sk: Yup.string()
})

export const handleInvitation = invitationPacked => async (
  dispatch,
  getState
) => {
  try {
    dispatch(logsHandlers.epics.saveLogs({ type: 'APPLICATION_LOGS', payload: `Processing new invitation` }))
    const identityAddress = identitySelectors.address(getState())
    const invitation = await inflate(invitationPacked)
    const lastblock = nodeSelectors.latestBlock(getState())
    const fetchTreshold = lastblock - 2000
    await invitationSchema.validate(invitation)
    if (invitation.sk) {
      await getClient().keys.importSK({
        sk: invitation.sk,
        startHeight: fetchTreshold })
      const amount = await getClient().accounting.balance(invitation.address)
      if (amount.gt(networkFee)) {
        const transfer = messages.createEmptyTransfer({
          address: identityAddress,
          amount: amount.minus(networkFee).toString(),
          identityAddress: invitation.address
        })
        await getClient().payment.send(transfer)
      }
    }
    await dispatch(
      identityHandlers.epics.updateDonationAddress(invitation.donationAddress)
    )
    dispatch(actionCreators.openModal('receivedInvitationModal')())
  } catch (err) {
    dispatch(
      actionCreators.openModal('receivedInvitationModal', {
        err: 'Error, try again'
      })()
    )
  }
}
export const epics = {
  generateInvitation,
  handleInvitation
}
export const reducer = handleActions(
  {
    [setInvitationAmount]: (state, { payload: amount }) =>
      state.set('amount', amount),
    [setInvitationAmountZec]: (state, { payload: amount }) =>
      state.set('amountZec', amount),
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
