
import React, { useEffect, useState } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import vaultHandlers from '../../store/handlers/vault'
import vaultSelectors from '../../store/selectors/vault'
import appSelectors from '../../store/selectors/app'
import VaultUnlockerFormComponent from '../../components/widgets/VaultUnlockerForm'
import electronStore from '../../../shared/electronStore'

export const mapStateToProps = state => ({
  isLogIn: vaultSelectors.isLogIn(state),
  exists: vaultSelectors.exists(state),
  isInitialLoadFinished: appSelectors.isInitialLoadFinished(state),
  mainChannelLoaded: electronStore.get('generalChannelInitialized')
})

export const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      onSubmit: vaultHandlers.epics.unlockVault
    },
    dispatch
  )
export const VaultUnlockerForm = ({
  ...props
}) => {
  const [isNewUser, setUserStatus] = useState(false)
  useEffect(() => {
    const userStatus = electronStore.get('isNewUser')
    setUserStatus(userStatus)
  }, [])
  return (
    <VaultUnlockerFormComponent
      isNewUser={isNewUser}
      onSubmit={() => {}}
      {...props}
    />
  )
}
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(VaultUnlockerForm)
