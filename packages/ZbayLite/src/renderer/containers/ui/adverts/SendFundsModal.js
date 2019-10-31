import React from 'react'
import * as R from 'ramda'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import { withModal } from '../../../store/handlers/modals'
import { rate } from '../../../store/selectors/rates'
import identitySelector from '../../../store/selectors/identity'
import advertHandlers from '../../../store/handlers/adverts'
import modalSelectors from '../../../store/selectors/modals'
import SendFundsForm from '../../../components/ui/adverts/SendFundsForm'

export const mapStateToProps = state => ({
  rateUsd: rate('usd')(state),
  rateZec: 1 / rate('usd')(state),
  balanceZec: identitySelector.balance('zec')(state),
  payload: modalSelectors.payload('advertSendFounds')(state),
  shippingData: identitySelector.shippingData(state)
})

export const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      handleSend: advertHandlers.epics.handleSend
    },
    dispatch
  )

export default R.compose(
  connect(
    mapStateToProps,
    mapDispatchToProps
  ),
  withModal('advertSendFounds'),
  React.memo
)(SendFundsForm)
