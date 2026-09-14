import React, { useCallback, useEffect } from 'react'
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
  const message = useSelector(network.selectors.loadingPanelType)
  const admissionFailure = useSelector(errors.selectors.admissionFailure)
  const admissionResetStatus = useSelector(communities.selectors.admissionResetStatus)
  const loadingPanelModal = useModal(ModalName.loadingPanel)

  const isConnected = useSelector(socketSelectors.isConnected)
  const currentCommunity = useSelector(communities.selectors.currentCommunity)
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

  const finishAdmissionReset = useCallback(async () => {
    try {
      await persistor.flush()
      dispatch(modalsActions.closeModal(ModalName.loadingPanel))
      dispatch(modalsActions.openModal({ name: ModalName.joinCommunityModal }))
      dispatch(communities.actions.setAdmissionResetStatus('idle'))
    } catch (error) {
      logger.error('Failed to persist cleared invitation state', error)
    }
  }, [dispatch])

  useEffect(() => {
    if (admissionResetStatus === 'complete') void finishAdmissionReset()
  }, [admissionResetStatus, finishAdmissionReset])

  useEffect(() => {
    const launchError = currentCommunityErrors[SocketActions.LAUNCH_COMMUNITY]
    const invalidInvite = launchError?.message === ErrorMessages.INVALID_INVITE
    if (message === LoadingPanelType.Failed && admissionFailure == null && !invalidInvite) {
      logger.info('Operation failed, returning to join community modal')
      dispatch(modalsActions.openModal({ name: ModalName.joinCommunityModal }))
      loadingPanelModal.handleClose()
    }
    if (invalidInvite) {
      dispatch(communities.actions.resetApp(undefined))
      dispatch(communities.actions.setJoinCommunityError({ type: 'invalid' }))
      dispatch(modalsActions.openModal({ name: ModalName.joinCommunityModal }))
      loadingPanelModal.handleClose()
    }
  }, [message, admissionFailure, currentCommunity, currentCommunityErrors, dispatch, loadingPanelModal])

  useEffect(() => {
    logger.info(
      'Checking if joining completed',
      JSON.stringify({ isJoiningCompletedSelector, areMessages, areChannels, isCurrentCommunityInitialized }, null, 2)
    )
    if (isJoiningCompletedSelector) {
      logger.info('Joining completed')
      loadingPanelModal.handleClose()
    }
  }, [isJoiningCompletedSelector, areMessages, areChannels, isCurrentCommunityInitialized])

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
      admissionFailure == null
    ) {
      logger.info('Application started, closing loading panel')
      loadingPanelModal.handleClose()
    }
  }, [isConnected, message, admissionResetStatus, admissionFailure])

  const openUrl = useCallback((url: string) => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    shell.openExternal(url)
  }, [])

  if (message === LoadingPanelType.StartingApplication) {
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
        />
      )
    } catch (e) {
      logger.error('Error in LoadingPanel', e)
      return null
    }
  }
}

export default LoadingPanel
