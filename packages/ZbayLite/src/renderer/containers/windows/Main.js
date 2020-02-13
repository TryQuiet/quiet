import React, { useEffect } from 'react'
import { Redirect } from 'react-router'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import * as R from 'ramda'

import MainComponent from '../../components/windows/Main'
import vaultSelectors from '../../store/selectors/vault'
import coordinator from '../../store/handlers/coordinator'
import electronStore from '../../../shared/electronStore'

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
  useEffect(() => {
    electronStore.set('isNewUser', false)
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
