import React, { useEffect } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import vaultSelectors from '../../store/selectors/vault'
import nodeSelectors from '../../store/selectors/node'
import appSelectors from '../../store/selectors/app'
import vaultHandlers from '../../store/handlers/vault'
import CreateVault from './CreateVault'
import UnlockVault from './UnlockVault'
import SpinnerLoader from '../../components/ui/SpinnerLoader'
import torHandlers from '../../store/handlers/tor'

export const mapStateToProps = state => ({
  exists: vaultSelectors.exists(state),
  nodeConnected: nodeSelectors.isConnected(state),
  newUser: appSelectors.newUser(state)
})

export const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      loadVaultStatus: vaultHandlers.epics.loadVaultStatus,
      createZcashNode: torHandlers.epics.createZcashNode
    },
    dispatch
  )

export const Vault = ({ loadVaultStatus, createZcashNode, exists, nodeConnected, newUser }) => {
  useEffect(() => {
    loadVaultStatus()
  })
  useEffect(() => {
    if (exists === false && !nodeConnected) {
      createZcashNode()
    }
  }, [exists])
  if (exists === false) {
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
