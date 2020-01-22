import React, { useEffect } from 'react'
import { Redirect } from 'react-router'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import SyncLoaderComponent from '../../components/windows/SyncLoader'
import nodeSelectors from '../../store/selectors/node'
import identitySelectors from '../../store/selectors/identity'
import nodeHandlers from '../../store/handlers/node'
import appHandlers from '../../store/handlers/app'
import vaultHandlers from '../../store/handlers/vault'
import vaultSelectors from '../../store/selectors/vault'
import { actionCreators } from '../../store/handlers/modals'
import electronStore from '../../../shared/electronStore'

import { useInterval } from '../hooks'

export const mapStateToProps = state => ({
  node: nodeSelectors.node(state),
  creating: vaultSelectors.creating(state),
  exists: vaultSelectors.exists(state),
  locked: vaultSelectors.locked(state),
  bootstrapping: nodeSelectors.bootstrapping(state),
  bootstrappingMessage: nodeSelectors.bootstrappingMessage(state),
  nodeConnected: nodeSelectors.isConnected(state),
  fetchingStatus: nodeSelectors.fetchingStatus(state),
  fetchingPart: nodeSelectors.fetchingPart(state),
  fetchingSizeLeft: nodeSelectors.fetchingSize(state),
  fetchingSpeed: nodeSelectors.fetchingSpeed(state),
  fetchingEndTime: nodeSelectors.fetchingEndTime(state),
  hasAddress: identitySelectors.address(state)
})
export const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      getStatus: nodeHandlers.epics.getStatus,
      openModal: actionCreators.openModal('topUp'),
      setVaultIdentity: vaultHandlers.epics.setVaultIdentity,
      skip: appHandlers.actions.setNewUser
    },
    dispatch
  )

export const SyncLoader = ({ setVaultIdentity, hasAddress, node, getStatus, bootstrapping, bootstrappingMessage, nodeConnected, openModal, creating, locked, exists, fetchingPart, fetchingSizeLeft, fetchingStatus, fetchingEndTime, fetchingSpeed }) => {
  useInterval(getStatus, 15000)
  useEffect(
    () => {
      if (!locked && nodeConnected && fetchingPart === 'blockchain' && fetchingStatus === 'SUCCESS') {
        setVaultIdentity()
      }
    },
    [nodeConnected, fetchingStatus, fetchingPart, locked]
  )
  const blockchainStatus = electronStore.get('AppStatus.blockchain.status')
  return (locked || (node.latestBlock.lt(400000) || node.currentBlock.div(node.latestBlock).lt(0.98))) ? (
    <SyncLoaderComponent fetchingEndTime={fetchingEndTime} fetchingSpeed={fetchingSpeed} hasAddress={hasAddress} node={node} blockchainStatus={blockchainStatus} bootstrapping={bootstrapping} bootstrappingMessage={bootstrappingMessage} openModal={openModal} nodeConnected={nodeConnected} fetchingPart={fetchingPart} fetchingSizeLeft={fetchingSizeLeft} fetchingStatus={fetchingStatus} />
  ) : (
    <Redirect to='/main/channel/general' />
  )
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SyncLoader)
