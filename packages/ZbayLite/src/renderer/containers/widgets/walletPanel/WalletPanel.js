import React from 'react'
import PropTypes from 'prop-types'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import * as R from 'ramda'

import WalletPanelComponent from '../../../components/widgets/walletPanel/WalletPanel'
import identityHandlers from '../../../store/handlers/identity'
import usersHandlers from '../../../store/handlers/users'
import ratesHandlers from '../../../store/handlers/rates'
import { useInterval } from '../../hooks'

export const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      getBalance: identityHandlers.epics.fetchBalance,
      fetchUsers: usersHandlers.epics.fetchUsers,
      fetchPrices: ratesHandlers.epics.fetchPrices
    },
    dispatch
  )

export const WalletPanel = ({ fetchPrices, fetchUsers, getBalance }) => {
  useInterval(getBalance, 15000)
  useInterval(fetchUsers, 15000)
  useInterval(fetchPrices, 60000)
  return <WalletPanelComponent />
}

WalletPanel.propTypes = {
  getBalance: PropTypes.func.isRequired,
  fetchUsers: PropTypes.func.isRequired,
  fetchPrices: PropTypes.func.isRequired
}

export default R.compose(
  connect(
    null,
    mapDispatchToProps
  )
)(WalletPanel)
