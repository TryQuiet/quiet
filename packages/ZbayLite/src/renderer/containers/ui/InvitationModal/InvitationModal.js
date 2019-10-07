import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import * as R from 'ramda'

import InvitationModalGenerate from '../../../components/ui/InvitationModal/InvitationModalGenerate'
import InvitationModalFinish from '../../../components/ui/InvitationModal/InvitationModalFinish'
import { withModal } from '../../../store/handlers/modals'
import invitationHandlers from '../../../store/handlers/invitation'
import invitationSelectors from '../../../store/selectors/invitation'
import ratesSelectors from '../../../store/selectors/rates'

export const mapStateToProps = state => ({
  amount: parseInt(invitationSelectors.amount(state)),
  affiliate: invitationSelectors.affiliateCode(state),
  zecRate: ratesSelectors.rate('usd')(state).toNumber()
})

export const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      setAmount: invitationHandlers.actions.setInvitationAmount,
      includeAffiliate: invitationHandlers.actions.setAffiliateCode,
      reset: invitationHandlers.actions.resetInvitation
    },
    dispatch
  )
const stepToComponent = {
  0: InvitationModalGenerate,
  1: InvitationModalFinish
}
export const InvitationModal = ({ ...props }) => {
  const [step, setStep] = React.useState(0)
  const InvitationModalComponent = stepToComponent[step]
  return <InvitationModalComponent {...props} setStep={setStep} />
}
export default R.compose(
  connect(
    mapStateToProps,
    mapDispatchToProps
  ),
  withModal('invitationModal')
)(InvitationModal)
