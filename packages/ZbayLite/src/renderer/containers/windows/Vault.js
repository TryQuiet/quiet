import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import vaultSelectors from '../../store/selectors/vault'
import nodeSelectors from '../../store/selectors/node'
import vaultHandlers from '../../store/handlers/vault'
import UnlockVault from './UnlockVault'
import torHandlers from '../../store/handlers/tor'
import electronStore from '../../../shared/electronStore'

export const mapStateToProps = state => ({
  exists: vaultSelectors.exists(state),
  nodeConnected: nodeSelectors.isConnected(state)
})

export const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      loadVaultStatus: vaultHandlers.epics.loadVaultStatus,
      createZcashNode: torHandlers.epics.createZcashNode
    },
    dispatch
  )

export const Vault = () => {
  const userStatus = electronStore.get('isNewUser')
  if (userStatus === undefined) {
    electronStore.set('isNewUser', true)
  }
  return <UnlockVault />
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Vault)
