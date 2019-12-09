import React from 'react'
import PropTypes from 'prop-types'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import * as R from 'ramda'

import WalletPanelComponent from '../../../components/widgets/walletPanel/WalletPanel'
import ratesHandlers from '../../../store/handlers/rates'
import { useInterval } from '../../hooks'
import { actions } from '../../../store/handlers/app'
import { actionCreators } from '../../../store/handlers/modals'

export const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      fetchPrices: ratesHandlers.epics.fetchPrices,
      setModalTab: () => actions.setModalTab('invite'),
      openInvitationModal: actionCreators.openModal('accountSettingsModal')
    },
    dispatch
  )

export const WalletPanel = ({ fetchPrices, ...props }) => {
  useInterval(fetchPrices, 15000)
  return <WalletPanelComponent {...props} />
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
