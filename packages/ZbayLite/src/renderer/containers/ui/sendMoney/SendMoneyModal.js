import React from 'react'
import * as R from 'ramda'
import { connect } from 'react-redux'

import { withModal } from '../../../store/handlers/modals'
import SendMoneyModalComponent from '../../../components/ui/sendMoney'
import { rate } from '../../../store/selectors/rates'
import identitySelector from '../../../store/selectors/identity'

export const mapStateToProps = state => ({
  rateUsd: rate('usd')(state),
  rateZec: rate('zec')(state),
  balanceZec: identitySelector.balance('zec')(state),
  userData: identitySelector.data(state)
})

export const SendMoneyModal = props => {
  const [step, setStep] = React.useState(1)
  return <SendMoneyModalComponent {...props} step={step} setStep={setStep} />
}

export default R.compose(
  connect(mapStateToProps),
  withModal('sendMoney')
)(SendMoneyModal)
