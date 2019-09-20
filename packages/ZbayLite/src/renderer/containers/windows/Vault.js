import React, { useEffect } from 'react'
import { bindActionCreators } from 'redux'
import { Redirect } from 'react-router'
import { connect } from 'react-redux'

import vaultSelectors from '../../store/selectors/vault'
import nodeSelectors from '../../store/selectors/node'
import vaultHandlers from '../../store/handlers/vault'
import CreateVault from './CreateVault'
import UnlockVault from './UnlockVault'

export const mapStateToProps = state => ({
  exists: vaultSelectors.exists(state),
  nodeConnected: nodeSelectors.isConnected(state)
})

export const mapDispatchToProps = dispatch => bindActionCreators({
  loadVaultStatus: vaultHandlers.epics.loadVaultStatus
}, dispatch)

export const Vault = ({ loadVaultStatus, exists, nodeConnected }) => {
  useEffect(() => {
    loadVaultStatus()
  }, [])
  if (!nodeConnected) {
    return <Redirect to='/' />
  }
  if (!exists) {
    return <CreateVault />
  }
  return <UnlockVault />
}

export default connect(mapStateToProps, mapDispatchToProps)(Vault)
