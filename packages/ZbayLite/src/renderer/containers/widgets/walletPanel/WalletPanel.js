import React from 'react'
import PropTypes from 'prop-types'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import * as R from 'ramda'

import WalletPanelComponent from '../../../components/widgets/walletPanel/WalletPanel'
import ratesHandlers from '../../../store/handlers/rates'
import { useInterval } from '../../hooks'

export const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      fetchPrices: ratesHandlers.epics.fetchPrices
    },
    dispatch
  )

export const WalletPanel = ({ fetchPrices }) => {
  useInterval(fetchPrices, 15000)
  return <WalletPanelComponent />
}

WalletPanel.propTypes = {
  fetchPrices: PropTypes.func.isRequired
}

export default R.compose(
  React.memo,
  connect(
    null,
    mapDispatchToProps
  )
)(WalletPanel)
