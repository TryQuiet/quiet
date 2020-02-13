import React, { useEffect, useState } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import { useInterval } from '../hooks'
import CreateVault from '../../components/windows/CreateVault'
import Loading from '../../containers/windows/Loading'
import vaultSelectors from '../../store/selectors/vault'
import nodeSelectors from '../../store/selectors/node'
import vaultHandlers from '../../store/handlers/vault'
import nodeHandlers from '../../store/handlers/node'
import electronStore from '../../../shared/electronStore'

export const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      onCloseSnackbar: vaultHandlers.actions.clearError,
      getStatus: nodeHandlers.epics.getStatus,
      createVault: (password) => vaultHandlers.epics.createVault({ password })
    },
    dispatch
  )

export const mapStateToProps = state => ({
  exists: vaultSelectors.exists(state),
  locked: vaultSelectors.locked(state),
  error: vaultSelectors.error(state),
  unlocking: vaultSelectors.unlocking(state),
  loading: vaultSelectors.creating(state),
  nodeConnected: nodeSelectors.isConnected(state),
  bootstrapping: nodeSelectors.bootstrapping(state),
  bootstrappingMessage: nodeSelectors.bootstrappingMessage(state),
  creating: vaultSelectors.creating(state)
})

export const CreateVaultWrapper = ({
  exists,
  locked,
  error,
  unlocking,
  loading,
  onCloseSnackbar,
  bootstrapping,
  bootstrappingMessage,
  nodeConnected,
  getStatus,
  createVault,
  creating
}) => {
  const isNewUser = electronStore.get('isNewUser')
  useInterval(getStatus, 5000)
  const [done, setDone] = useState(null)
  const [password, storePass] = useState(null)
  const [passwordPosted, setPasswordPosted] = useState(null)
  useEffect(
    () => {
      if (exists && !locked) {
        setDone(true)
      }
    },
    [exists, locked]
  )
  useEffect(
    () => {
      if (unlocking === true) {
        setDone(false)
      }
    },
    [unlocking]
  )
  useEffect(
    () => {
      if (passwordPosted && !bootstrapping && nodeConnected) {
        createVault(password)
      }
    },
    [passwordPosted, bootstrapping, nodeConnected]
  )
  const isVaultCreationComplete = passwordPosted && !bootstrapping && nodeConnected
  const isDev = process.env.NODE_ENV === 'development'
  return (!isDev && (passwordPosted || isNewUser)) ? <Loading message={bootstrapping ? bootstrappingMessage : null} /> : (
    <CreateVault
      inProgress={loading || unlocking}
      inProgressMsg={loading ? 'loading' : 'creating'}
      finished={done}
      error={error}
      storePass={storePass}
      setPasswordPosted={setPasswordPosted}
      onCloseSnackbar={onCloseSnackbar}
      passwordPosted={passwordPosted}
      isVaultCreationComplete={isVaultCreationComplete}
    />
  )
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CreateVaultWrapper)
