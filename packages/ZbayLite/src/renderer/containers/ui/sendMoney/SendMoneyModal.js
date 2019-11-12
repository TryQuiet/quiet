import React from 'react'
import * as R from 'ramda'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import { withModal } from '../../../store/handlers/modals'
import SendMoneyModalComponent from '../../../components/ui/sendMoney'
import { rate } from '../../../store/selectors/rates'
import identitySelector from '../../../store/selectors/identity'
import directMessages from '../../../store/handlers/contacts'
import modalsSelectors from '../../../store/selectors/modals'

export const mapStateToProps = state => ({
  rateUsd: rate('usd')(state),
  rateZec: 1 / rate('usd')(state),
  balanceZec: identitySelector.balance('zec')(state),
  userData: identitySelector.data(state),
  shippingData: identitySelector.shippingData(state),
  targetRecipientAddress: modalsSelectors.payload('sendMoney')(state)
})

export const SendMoneyModal = props => {
  const [step, setStep] = React.useState(1)
  return <SendMoneyModalComponent {...props} step={step} setStep={setStep} />
}
export const mapDispatchToProps = dispatch => bindActionCreators({
  sendMessageHandler: directMessages.epics.sendDirectMessage
}, dispatch)

export default R.compose(
  connect(mapStateToProps, mapDispatchToProps),
  withModal('sendMoney'),
  React.memo
)(SendMoneyModal)
