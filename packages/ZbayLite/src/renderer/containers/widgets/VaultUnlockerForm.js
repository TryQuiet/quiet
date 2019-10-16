import React, { useEffect, useState } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import vaultHandlers from '../../store/handlers/vault'
import nodeHandlers from '../../store/handlers/node'
import vaultSelectors from '../../store/selectors/vault'
import appSelectors from '../../store/selectors/app'
import nodeSelectors from '../../store/selectors/node'
import identitySelectors from '../../store/selectors/identity'
import VaultUnlockerFormComponent from '../../components/widgets/VaultUnlockerForm'
import { useInterval } from '../hooks'

export const mapStateToProps = state => ({
  unlocking: vaultSelectors.unlocking(state),
  locked: vaultSelectors.locked(state),
  newUser: appSelectors.newUser(state),
  loader: identitySelectors.loader(state),
  nodeConnected: nodeSelectors.isConnected(state)
})

export const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      onSubmit: vaultHandlers.epics.unlockVault,
      setVaultIdentity: vaultHandlers.epics.setVaultIdentity,
      getStatus: nodeHandlers.epics.getStatus
    },
    dispatch
  )
export const VaultUnlockerForm = ({
  newUser,
  locked,
  setVaultIdentity,
  getStatus,
  loader,
  nodeConnected,
  ...props
}) => {
  const [done, setDone] = useState(false)
  useEffect(
    () => {
      if (!newUser && !locked && nodeConnected) {
        setVaultIdentity()
      }
    },
    [locked, nodeConnected]
  )
  useEffect(
    () => {
      if (!newUser && !locked && !loader.loading && nodeConnected) {
        setDone(true)
      }
    },
    [loader.loading]
  )
  useEffect(
    () => {
      setDone(!done)
    },
    [locked]
  )

  useInterval(getStatus, 1000)
  return (
    <VaultUnlockerFormComponent
      newUser={newUser}
      locked={locked}
      loader={loader}
      done={done}
      setDone={setDone}
      nodeConnected={nodeConnected}
      {...props}
    />
  )
}
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(VaultUnlockerForm)
