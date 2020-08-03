import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import vaultHandlers from '../../store/handlers/vault'
import nodeHandlers from '../../store/handlers/node'
import vaultSelectors from '../../store/selectors/vault'
import nodeSelectors from '../../store/selectors/node'
import identitySelectors from '../../store/selectors/identity'
import VaultUnlockerFormComponent from '../../components/widgets/VaultUnlockerForm'
// import { useInterval } from '../hooks'

export const mapStateToProps = state => ({
  isLogIn: vaultSelectors.isLogIn(state),
  locked: vaultSelectors.locked(state),
  loader: identitySelectors.loader(state),
  nodeConnected: nodeSelectors.isConnected(state),
  exists: vaultSelectors.exists(state)
})

export const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      onSubmit: vaultHandlers.epics.unlockVault,
      getStatus: nodeHandlers.epics.getStatus
    },
    dispatch
  )
export const VaultUnlockerForm = ({
  locked,
  getStatus,
  nodeConnected,
  isLogIn,
  exists,
  loader,
  ...props
}) => {
  return (
    <VaultUnlockerFormComponent
      locked={locked}
      loader={loader}
      exists={exists}
      nodeConnected={nodeConnected}
      isLogIn={isLogIn}
      {...props}
    />
  )
}
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(VaultUnlockerForm)
