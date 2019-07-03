import React, { useEffect } from 'react'
import { bindActionCreators } from 'redux'
import { Redirect } from 'react-router'
import { connect } from 'react-redux'

import vaultSelectors from '../../store/selectors/vault'
import vaultUnlockerSelectors from '../../store/selectors/vaultUnlocker'
import nodeSelectors from '../../store/selectors/node'
import vaultHandlers from '../../store/handlers/vault'
import CreateVault from './CreateVault'
import UnlockVault from './UnlockVault'

export const mapStateToProps = state => ({
  exists: vaultSelectors.exists(state),
  locked: vaultSelectors.locked(state),
  unlocking: vaultUnlockerSelectors.unlocking(state),
  nodeConnected: nodeSelectors.isConnected(state)
})

export const mapDispatchToProps = dispatch => bindActionCreators({
  loadVaultStatus: vaultHandlers.epics.loadVaultStatus
}, dispatch)

export const Vault = ({ loadVaultStatus, exists, unlocking, locked, nodeConnected }) => {
  useEffect(() => {
    loadVaultStatus()
  })
  if (!nodeConnected) {
    return <Redirect to='/' />
  }
  if (!exists) {
    return <CreateVault />
  } else if (locked || unlocking) {
    return <UnlockVault />
  }
  return <Redirect to='/main/channel/general' />
}

export default connect(mapStateToProps, mapDispatchToProps)(Vault)
