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
  hasAddress: identitySelectors.address(state),
  isRescanningMonitorStarted: nodeSelectors.isRescanningMonitorStarted(state),
  rescanningProgress: nodeSelectors.rescanningProgress(state),
  isFetching: nodeSelectors.isFetching(state)
})
export const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      getStatus: nodeHandlers.epics.getStatus,
      openModal: actionCreators.openModal('topUp'),
      setVaultIdentity: vaultHandlers.epics.setVaultIdentity,
      skip: appHandlers.actions.setNewUser,
      startRescanningMonitor: nodeHandlers.epics.startRescanningMonitor,
      disablePowerSaveMode: nodeHandlers.epics.disablePowerSaveMode
    },
    dispatch
  )

export const SyncLoader = ({ setVaultIdentity, isFetching, disablePowerSaveMode, isRescanningMonitorStarted, rescanningProgress, startRescanningMonitor, hasAddress, node, getStatus, bootstrapping, bootstrappingMessage, nodeConnected, openModal, creating, locked, exists, fetchingPart, fetchingSizeLeft, fetchingStatus, fetchingEndTime, fetchingSpeed }) => {
  const blockchainStatus = electronStore.get('AppStatus.blockchain.status')
  const isBlockchainRescanned = electronStore.get('AppStatus.blockchain.isRescanned')
  const lastBlock = node.latestBlock.isEqualTo(0) ? 999999 : node.latestBlock
  const sync = parseFloat(node.currentBlock.div(lastBlock) * 100).toFixed(2)
  const fetching = ((((26202539059 - (fetchingSizeLeft)) * 100) / 26202539059)).toFixed()
  let ETA = null
  if (fetchingEndTime) {
    const { hours, minutes } = fetchingEndTime
    ETA = `${hours ? `${hours}h` : ''} ${minutes ? `${minutes}m left` : ''}`
  }
  const rescanningProgressInPercents = rescanningProgress / 722000 * 100
  const isFetchingComplete = ((fetchingPart === 'blockchain' && fetchingStatus === 'SUCCESS') || blockchainStatus === 'SUCCESS')
  const isRescaningComplete = ((isBlockchainRescanned || rescanningProgressInPercents > 80) && !node.latestBlock.isEqualTo(0))
  const rescanningWithFetchingPartProgress = 50 + (rescanningProgressInPercents / 2)
  let progressValue
  let message
  useInterval(getStatus, 15000)
  useEffect(
    () => {
      if ((!locked && nodeConnected && fetchingPart === 'blockchain' && fetchingStatus === 'SUCCESS') || blockchainStatus === 'SUCCESS') {
        if (nodeConnected) {
          setVaultIdentity()
        }
        if (!isRescanningMonitorStarted) {
          startRescanningMonitor()
        }
      }
    },
    [nodeConnected, fetchingStatus, fetchingPart, locked]
  )
  useEffect(
    () => {
      if (isFetchingComplete && isRescaningComplete) {
        setVaultIdentity()
        startRescanningMonitor()
        disablePowerSaveMode()
      }
    },
    [isFetchingComplete, isRescaningComplete]
  )
  if (!isFetchingComplete) {
    const fetchingProgress = fetching === '100' ? 0 : fetching / 2
    progressValue = fetchingProgress
  } else if (!isRescaningComplete) {
    progressValue = rescanningWithFetchingPartProgress
    message = `Rescanning blocks, ${rescanningProgress ? ETA || '~40 minutes left' : '~40 minutes left'} (${rescanningProgress}/722000)`
  } else {
    electronStore.set('AppStatus.blockchain.isRescanned', true)
    progressValue = sync
    message = `Final sync (${node.currentBlock}/${lastBlock})`
  }
  return (locked || (node.latestBlock.lt(400000) || node.latestBlock.minus(node.currentBlock).gt(10))) ? (
    <SyncLoaderComponent
      isBlockchainRescanned={isBlockchainRescanned}
      isRescanningMonitorStarted={isRescanningMonitorStarted}
      rescanningProgress={rescanningProgress}
      fetchingEndTime={fetchingEndTime}
      fetchingSpeed={fetchingSpeed}
      hasAddress={hasAddress}
      node={node}
      blockchainStatus={blockchainStatus}
      bootstrapping={bootstrapping}
      bootstrappingMessage={bootstrappingMessage}
      openModal={openModal}
      nodeConnected={nodeConnected}
      fetchingPart={fetchingPart}
      fetchingSizeLeft={fetchingSizeLeft}
      fetchingStatus={fetchingStatus}
      ETA={ETA}
      progressValue={progressValue}
      isFetching={isFetching}
      message={message} />
  ) : (
    <Redirect to='/main/channel/general' />
  )
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(SyncLoader)
