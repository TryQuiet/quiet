import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import * as R from 'ramda'

import WalletPanelComponent from '../../../components/widgets/walletPanel/WalletPanel'
import { actions } from '../../../store/handlers/app'
import { actionCreators } from '../../../store/handlers/modals'

export const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      setModalTab: () => actions.setModalTab('invite'),
      openInvitationModal: actionCreators.openModal('accountSettingsModal')
    },
    dispatch
  )

export const WalletPanel = ({ fetchPrices, ...props }) => {
  return <WalletPanelComponent {...props} />
}

export default R.compose(
  React.memo,
  connect(null, mapDispatchToProps)
)(WalletPanel)
