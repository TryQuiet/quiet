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
import torSelectors from '../../store/selectors/tor'
import torHandlers from '../../store/handlers/tor'

export const mapStateToProps = state => ({
  unlocking: vaultSelectors.unlocking(state),
  locked: vaultSelectors.locked(state),
  newUser: appSelectors.newUser(state),
  loader: identitySelectors.loader(state),
  nodeConnected: nodeSelectors.isConnected(state),
  tor: torSelectors.tor(state)
})

export const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      onSubmit: vaultHandlers.epics.unlockVault,
      setVaultIdentity: vaultHandlers.epics.setVaultIdentity,
      getStatus: nodeHandlers.epics.getStatus,
      createZcashNode: torHandlers.epics.createZcashNode
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
  tor,
  createZcashNode,
  ...props
}) => {
  const [done, setDone] = useState(true)
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
      if (!locked) {
        createZcashNode(tor.url)
      }
    },
    [locked]
  )
  useEffect(
    () => {
      if (!newUser && !locked && !loader.loading && nodeConnected) {
        setDone(true)
      }
    },
    [loader.loading]
  )

  useInterval(getStatus, 1000)
  return (
    <VaultUnlockerFormComponent
      newUser={newUser}
      locked={locked}
      loader={loader}
      done={done}
      tor={tor}
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
