
import React, { useEffect, useState } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import vaultHandlers from '../../store/handlers/vault'
// import nodeHandlers from '../../store/handlers/node'
import vaultSelectors from '../../store/selectors/vault'
// import nodeSelectors from '../../store/selectors/node'
import appSelectors from '../../store/selectors/app'
import identitySelectors from '../../store/selectors/identity'
import VaultUnlockerFormComponent from '../../components/widgets/VaultUnlockerForm'
// import { actionCreators } from '../../store/handlers/modals'
import electronStore from '../../../shared/electronStore'

export const mapStateToProps = state => ({
  isLogIn: vaultSelectors.isLogIn(state),
  loader: identitySelectors.loader(state),
  // currentBlock: nodeSelectors.currentBlock(state),
  // latestBlock: nodeSelectors.latestBlock(state),
  // nodeConnected: nodeSelectors.isConnected(state),
  // isRescanning: nodeSelectors.isRescanning(state),
  exists: vaultSelectors.exists(state),
  isInitialLoadFinished: appSelectors.isInitialLoadFinished(state),
  mainChannelLoaded: electronStore.get('generalChannelInitialized')
})

export const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      onSubmit: vaultHandlers.epics.unlockVault
      // getStatus: nodeHandlers.epics.getStatus
    },
    dispatch
  )
export const VaultUnlockerForm = ({
  getStatus,
  nodeConnected,
  isLogIn,
  exists,
  loader,
  guideStatus,
  ...props
}) => {
  const [isNewUser, setUserStatus] = useState(false)
  useEffect(() => {
    const userStatus = electronStore.get('isNewUser')
    setUserStatus(userStatus)
  }, [])
  return (
    <VaultUnlockerFormComponent
      loader={loader}
      exists={exists}
      nodeConnected={nodeConnected}
      isLogIn={isLogIn}
      isNewUser={isNewUser}
      {...props}
    />
  )
}
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(VaultUnlockerForm)
