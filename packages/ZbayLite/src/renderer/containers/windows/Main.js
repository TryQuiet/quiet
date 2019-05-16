import React from 'react'
import { Redirect } from 'react-router'
import { connect } from 'react-redux'

import MainComponent from '../../components/windows/Main'
import vaultSelectors from '../../store/selectors/vault'

export const mapStateToProps = state => ({
  vaultLocked: vaultSelectors.locked(state)
})

export const Main = ({ vaultLocked, ...props }) => (
  vaultLocked
    ? <Redirect to='/vault' />
    : <MainComponent {...props} />
)

export default connect(mapStateToProps)(Main)
