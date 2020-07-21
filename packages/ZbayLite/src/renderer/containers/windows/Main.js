import React from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import * as R from 'ramda'

import MainComponent from '../../components/windows/Main'
import vaultSelectors from '../../store/selectors/vault'
import coordinator from '../../store/handlers/coordinator'
import nodeHandlers from '../../store/handlers/node'
import logsSelectors from '../../store/selectors/logs'
import { createWalletBackup } from '../../store/handlers/identity'

export const mapStateToProps = state => ({
  vaultLocked: vaultSelectors.locked(state),
  isLogWindowOpened: logsSelectors.isLogWindowOpened(state)

})
export const mapDispatchToProps = dispatch => {
  return bindActionCreators(
    {
      fetch: coordinator.epics.coordinator,
      disablePowerSleepMode: nodeHandlers.epics.disablePowerSaveMode,
      createWalletCopy: createWalletBackup

    },
    dispatch
  )
}

export const Main = ({ ...props }) => {
  return <MainComponent {...props} />
}

export default R.compose(
  React.memo,
  connect(
    mapStateToProps,
    mapDispatchToProps
  )
)(Main)
