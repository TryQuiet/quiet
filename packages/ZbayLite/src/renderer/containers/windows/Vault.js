import React, { useEffect } from 'react'
import { bindActionCreators } from 'redux'
import { Redirect } from 'react-router'
import { connect } from 'react-redux'

import vaultSelectors from '../../store/selectors/vault'
import nodeSelectors from '../../store/selectors/node'
import vaultHandlers from '../../store/handlers/vault'
import CreateVault from './CreateVault'
import UnlockVault from './UnlockVault'
import SpinnerLoader from '../../components/ui/SpinnerLoader'

export const mapStateToProps = state => ({
  exists: vaultSelectors.exists(state),
  nodeConnected: nodeSelectors.isConnected(state)
})

export const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      loadVaultStatus: vaultHandlers.epics.loadVaultStatus
    },
    dispatch
  )

export const Vault = ({ loadVaultStatus, exists, nodeConnected }) => {
  useEffect(() => {
    loadVaultStatus()
  })
  if (exists === false) {
    if (!nodeConnected) {
      return <Redirect to='/zcashNode' />
    }
    return <CreateVault />
  } else {
    if (exists === true) {
      return <UnlockVault />
    }
  }
  return <SpinnerLoader size={80} />
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Vault)
