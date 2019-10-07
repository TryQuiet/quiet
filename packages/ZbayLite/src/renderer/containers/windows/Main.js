import React, { useEffect } from 'react'
import { Redirect } from 'react-router'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import MainComponent from '../../components/windows/Main'
import vaultSelectors from '../../store/selectors/vault'
import coordinator from '../../store/handlers/coordinator'

export const mapStateToProps = state => ({
  vaultLocked: vaultSelectors.locked(state)
})
export const mapDispatchToProps = dispatch => {
  return bindActionCreators(
    {
      fetch: coordinator.epics.coordinator
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

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Main)
