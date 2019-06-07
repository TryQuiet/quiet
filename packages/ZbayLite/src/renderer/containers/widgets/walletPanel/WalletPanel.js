import React, { useState } from 'react'
import PropTypes from 'prop-types'
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
  const [topUpOpen, setTopUpOpen] = useState(false)
  return (
    <WalletPanelComponent
      handleReceive={() => setTopUpOpen(true)}
      handleCloseTopUp={() => setTopUpOpen(false)}
      topUpOpen={topUpOpen}
    />
  )
}

WalletPanel.propTypes = {
  getBalance: PropTypes.func.isRequired
}

export default connect(null, mapDispatchToProps)(WalletPanel)
