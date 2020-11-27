import { produce, immerable } from 'immer'
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
import { DOMAIN, networkFee, actionTypes } from '../../../shared/static'
import nodeSelectors from '../selectors/node'

import { ActionsType, PayloadType } from './types'

export const getInvitationUrl = invitation =>
  `https://${DOMAIN}/invitation=${encodeURIComponent(invitation)}`

class Invitation {
  amount: number
  amountZec: number
  affiliateCode: boolean
  generatedInvitation: string

  constructor(values?: Partial<Invitation>) {
    Object.assign(this, values)
    this[immerable] = true
  }
}

const initialState: Invitation = {
  ...new Invitation({
    amount: 0,
    amountZec: 0,
    affiliateCode: true,
    generatedInvitation: ''
  })
}

const setInvitationAmount = createAction<number>(actionTypes.SET_INVITATION_AMOUNT)
const setInvitationAmountZec = createAction<number>(actionTypes.SET_INVITATION_AMOUNT_ZEC)
const setAffiliateCode = createAction<boolean>(actionTypes.SET_AFFILIATE_CODE)
const resetInvitation = createAction(actionTypes.RESET_INVITATION)
const setGeneratedInvitation = createAction<string>(actionTypes.SET_GENERATED_INVITATION)

export const actions = {
  setInvitationAmount,
  setAffiliateCode,
  resetInvitation,
  setGeneratedInvitation,
  setInvitationAmountZec
}

export type InvitationActions = ActionsType<typeof actions>

export const generateInvitation = () => async (dispatch, getState) => {
  const amountUsd = invitationSelector.amount(getState())
  const amountZec = invitationSelector.amountZec(getState())
  const includeAffiliate = invitationSelector.affiliateCode(getState())
  const identityAddress = identitySelectors.address(getState())
  const zecRate = ratesSelectors.rate('usd')(getState()).toNumber()
  const amount = amountZec || Number(new BigNumber(amountUsd / zecRate).toNumber().toFixed(8))
  let donationAddress
  if (includeAffiliate) {
    donationAddress = identityAddress
  } else {
    donationAddress = donationTarget
  }
  if (amount > 0) {
    const { value: address } = await dispatch(nodeHandlers.actions.createAddress())
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
  await dispatch(setInvitationAmount(Number((amount * zecRate).toFixed(2))))
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
    const lastblock = nodeSelectors.latestBlock(getState()).toNumber()
    const fetchTreshold = lastblock - 2000
    await invitationSchema.validate(invitation)
    if (invitation.sk) {
      await getClient().keys.importSK({
        sk: invitation.sk,
        startHeight: fetchTreshold
      })
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
    await dispatch(identityHandlers.epics.updateDonationAddress(invitation.donationAddress))
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
export const reducer = handleActions<Invitation, PayloadType<InvitationActions>>(
  {
    [setInvitationAmount.toString()]: (
      state,
      { payload: amount }: InvitationActions['setInvitationAmount']
    ) =>
      produce(state, draft => {
        draft.amount = amount
      }),
    [setInvitationAmountZec.toString()]: (
      state,
      { payload: amount }: InvitationActions['setInvitationAmountZec']
    ) =>
      produce(state, draft => {
        draft.amountZec = amount
      }),
    [setGeneratedInvitation.toString()]: (
      state,
      { payload: invitation }: InvitationActions['setGeneratedInvitation']
    ) =>
      produce(state, draft => {
        draft.generatedInvitation = invitation
      }),
    [resetInvitation.toString()]: state =>
      produce(state, draft => {
        draft.affiliateCode = true
        draft.amount = 0
        draft.amountZec = 0
        draft.generatedInvitation = ''
      }),
    [setAffiliateCode.toString()]: (
      state,
      { payload: affiliateCode }: InvitationActions['setAffiliateCode']
    ) =>
      produce(state, draft => {
        draft.affiliateCode = affiliateCode
      })
  },
  initialState
)

export default {
  actions,
  reducer,
  epics
}
