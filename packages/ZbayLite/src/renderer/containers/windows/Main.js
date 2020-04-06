import React, { useEffect } from 'react'
import { Redirect } from 'react-router'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import * as R from 'ramda'

import MainComponent from '../../components/windows/Main'
import vaultSelectors from '../../store/selectors/vault'
import coordinator from '../../store/handlers/coordinator'
import nodeHandlers from '../../store/handlers/node'
import logsSelectors from '../../store/selectors/logs'

export const mapStateToProps = state => ({
  vaultLocked: vaultSelectors.locked(state),
  isLogWindowOpened: logsSelectors.isLogWindowOpened(state)

})
export const mapDispatchToProps = dispatch => {
  return bindActionCreators(
    {
      fetch: coordinator.epics.coordinator,
      disablePowerSleepMode: nodeHandlers.epics.disablePowerSaveMode
    },
    dispatch
  )
}

export const Main = ({ vaultLocked, fetch, ...props }) => {
  useEffect(() => {
    fetch()
  }, [])
  return vaultLocked ? <Redirect to='/vault' /> : <MainComponent {...props} />
}

export default R.compose(
  React.memo,
  connect(
    mapStateToProps,
    mapDispatchToProps
  )
)(Main)
