import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import * as R from 'ramda'

import modalsHandlers, { withModal } from '../../store/handlers/modals'
import DepositMoneyModal from '../../components/ui/DepositMoneyModal'

export const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      onClick: modalsHandlers.actionCreators.openModal('topUp')
    },
    dispatch
  )

export default R.compose(
  React.memo,
  connect(
    null,
    mapDispatchToProps
  ),
  withModal('depositMoney')
)(DepositMoneyModal)
