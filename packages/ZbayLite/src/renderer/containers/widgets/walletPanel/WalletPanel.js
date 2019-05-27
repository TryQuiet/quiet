import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import WalletPanelComponent from '../../../components/widgets/walletPanel/WalletPanel'
import identityHandlers from '../../../store/handlers/identity'
import { useInterval } from '../../hooks'

export const mapDispatchToProps = dispatch => bindActionCreators({
  getBalance: identityHandlers.epics.fetchBalance
}, dispatch)

export const WalletPanel = ({ className, getBalance }) => {
  useInterval(getBalance, 15000)
  return (
    <WalletPanelComponent />
  )
}

export default connect(null, mapDispatchToProps)(WalletPanel)
