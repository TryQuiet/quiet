import React, { useCallback, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useModal } from '../../containers/hooks'
import { ModalName } from '../../sagas/modals/modals.types'
import { socketSelectors } from '../../sagas/socket/socket.selectors'
import { communities, publicChannels, users, connection, network, errors } from '@quiet/state-manager'
import { modalsActions } from '../../sagas/modals/modals.slice'
import { shell } from 'electron'
import JoiningPanelComponent from './JoiningPanelComponent'
import StartingPanelComponent from './StartingPanelComponent'
import { LoadingPanelType, ErrorMessages, CommunityOwnership, SocketActions } from '@quiet/types'
import { createLogger } from '../../logger'
import { persistor } from '../../store/persistor'

const logger = createLogger('LoadingPanel')

const LoadingPanel = () => {
  const dispatch = useDispatch()
  const [finalizationFailed, setFinalizationFailed] = useState(false)
  const message = useSelector(network.selectors.loadingPanelType)
  const admissionFailure = useSelector(errors.selectors.admissionFailure)
  const admissionResetStatus = useSelector(communities.selectors.admissionResetStatus)
  const admissionResetResult = useSelector(communities.selectors.admissionResetResult)
  const loadingPanelModal = useModal(ModalName.loadingPanel)

  const isConnected = useSelector(socketSelectors.isConnected)
  const currentCommunity = useSelector(communities.selectors.currentCommunity)
  const currentCommunityId = useSelector(communities.selectors.currentCommunityId)
  const currentCommunityErrors = useSelector(errors.selectors.currentCommunityErrors)
  const isChannelReplicated = Boolean(useSelector(publicChannels.selectors.publicChannels)?.length > 0)
  const community = useSelector(communities.selectors.currentCommunity)
  const owner = Boolean(community?.ownership === CommunityOwnership.Owner)
  const usersData = Object.keys(useSelector(users.selectors.allUsers))
  const isOnlyOneUser = usersData.length === 1
  const connectionProcessSelector = useSelector(connection.selectors.connectionProcess)
  const isJoiningCompletedSelector = useSelector(connection.selectors.isJoiningCompleted)
  const areMessages = useSelector(publicChannels.selectors.areMessagesLoaded)
  const areChannels = useSelector(publicChannels.selectors.areChannelsLoaded)
  const isCurrentCommunityInitialized = useSelector(network.selectors.isCurrentCommunityInitialized)

  const persistFinalizedReset = useCallback(async () => {
    try {
      await persistor.flush()
      dispatch(communities.actions.setAdmissionResetStatus('idle'))
      setFinalizationFailed(false)
      dispatch(modalsActions.closeModal(ModalName.loadingPanel))
      dispatch(modalsActions.openModal({ name: ModalName.joinCommunityModal }))
    } catch (error) {
      logger.error('Failed to persist cleared invitation state', error)
      setFinalizationFailed(true)
      dispatch(modalsActions.openModal({ name: ModalName.loadingPanel }))
    }
  }, [dispatch])

  const finishAdmissionReset = useCallback(async () => {
    if (!admissionResetResult) return
    dispatch(communities.actions.finalizeAdmissionReset(admissionResetResult))
    await persistFinalizedReset()
  }, [admissionResetResult, dispatch, persistFinalizedReset])

  useEffect(() => {
    if (admissionResetStatus === 'complete') void finishAdmissionReset()
  }, [admissionResetStatus, finishAdmissionReset])

  useEffect(() => {
    if (admissionResetStatus !== 'idle') {
      dispatch(modalsActions.closeModal(ModalName.joinCommunityModal))
      dispatch(modalsActions.openModal({ name: ModalName.loadingPanel }))
    }
  }, [admissionResetStatus, dispatch])

  useEffect(() => {
    const launchError = currentCommunityErrors[SocketActions.LAUNCH_COMMUNITY]
    const invalidInvite = launchError?.message === ErrorMessages.INVALID_INVITE
    if (
      message === LoadingPanelType.Failed &&
      admissionFailure == null &&
      !invalidInvite &&
      admissionResetStatus === 'idle'
    ) {
      logger.info('Operation failed, returning to join community modal')
      dispatch(modalsActions.openModal({ name: ModalName.joinCommunityModal }))
      dispatch(modalsActions.closeModal(ModalName.loadingPanel))
    }
    if (invalidInvite && currentCommunity && admissionResetStatus === 'idle') {
      dispatch(communities.actions.resetAdmission(currentCommunity.id))
    }
  }, [message, admissionFailure, admissionResetStatus, currentCommunity, currentCommunityErrors, dispatch])

  useEffect(() => {
    logger.info(
      'Checking if joining completed',
      JSON.stringify({ isJoiningCompletedSelector, areMessages, areChannels, isCurrentCommunityInitialized }, null, 2)
    )
    if (isJoiningCompletedSelector) {
      logger.info('Joining completed')
      if (currentCommunity?.inviteData) {
        dispatch(
          communities.actions.updateCommunityData({
            id: currentCommunity.id,
            updates: { inviteData: null },
          })
        )
      }
      dispatch(modalsActions.closeModal(ModalName.loadingPanel))
    }
  }, [areChannels, areMessages, currentCommunity, dispatch, isCurrentCommunityInitialized, isJoiningCompletedSelector])

  useEffect(() => {
    if (isConnected) {
      if (currentCommunity && isChannelReplicated && owner && isOnlyOneUser) {
        const notification = new Notification('Community created!', {
          body: 'Visit Settings for an invite link you can share.',
          icon: '../../build' + '/icon.png',
          silent: true,
        })

        notification.onclick = () => {
          dispatch(modalsActions.openModal({ name: ModalName.accountSettingsModal }))
        }
      }
    }
  }, [isConnected, currentCommunity, isChannelReplicated])

  useEffect(() => {
    if (
      isConnected &&
      message === LoadingPanelType.StartingApplication &&
      admissionResetStatus === 'idle' &&
      admissionFailure == null &&
      !finalizationFailed
    ) {
      logger.info('Application started, closing loading panel')
      dispatch(modalsActions.closeModal(ModalName.loadingPanel))
    }
  }, [admissionFailure, admissionResetStatus, dispatch, finalizationFailed, isConnected, message])

  const openUrl = useCallback((url: string) => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    shell.openExternal(url)
  }, [])

  if (message === LoadingPanelType.StartingApplication && admissionResetStatus === 'idle' && !finalizationFailed) {
    logger.info('Starting application')
    return <StartingPanelComponent {...loadingPanelModal} />
  } else {
    try {
      logger.info('Showing joining panel')
      return (
        <JoiningPanelComponent
          {...loadingPanelModal}
          openUrl={openUrl}
          connectionInfo={connectionProcessSelector}
          isOwner={owner}
          resetFailed={admissionResetStatus === 'failed' || finalizationFailed}
          resetFailureMessage={
            finalizationFailed
              ? 'Quiet cleared the failed link but could not save the updated app state. Try saving again before using another invite.'
              : undefined
          }
          onRetryReset={() => {
            if (finalizationFailed) {
              void persistFinalizedReset()
            } else if (currentCommunityId) {
              dispatch(communities.actions.resetAdmission(currentCommunityId))
            }
          }}
        />
      )
    } catch (e) {
      logger.error('Error in LoadingPanel', e)
      return null
    }
  }
}

export default LoadingPanel
