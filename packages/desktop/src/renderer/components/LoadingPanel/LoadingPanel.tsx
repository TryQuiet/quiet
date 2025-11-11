import React, { useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useModal } from '../../containers/hooks'
import { ModalName } from '../../sagas/modals/modals.types'
import { socketSelectors } from '../../sagas/socket/socket.selectors'
import { communities, publicChannels, users, connection, network } from '@quiet/state-manager'
import { modalsActions } from '../../sagas/modals/modals.slice'
import { shell } from 'electron'
import JoiningPanelComponent from './JoiningPanelComponent'
import StartingPanelComponent from './StartingPanelComponent'
import { LoadingPanelType, ErrorCodes, CommunityOwnership } from '@quiet/types'
import { createLogger } from '../../logger'

const logger = createLogger('LoadingPanel')

const LoadingPanel = () => {
  const dispatch = useDispatch()
  const message = useSelector(network.selectors.loadingPanelType)
  const loadingPanelModal = useModal(ModalName.loadingPanel)

  const isConnected = useSelector(socketSelectors.isConnected)
  const currentCommunity = useSelector(communities.selectors.currentCommunity)
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

  useEffect(() => {
    if (message === LoadingPanelType.Failed) {
      logger.info('Operation failed, returning to join community modal')
      dispatch(modalsActions.openModal({ name: ModalName.joinCommunityModal }))
      loadingPanelModal.handleClose()
    }
  }, [message])

  useEffect(() => {
    logger.info(
      'Checking if joining completed',
      JSON.stringify({ isJoiningCompletedSelector, areMessages, areChannels, isCurrentCommunityInitialized }, null, 2)
    )
    if (isJoiningCompletedSelector) {
      logger.info('Joining completed')
      loadingPanelModal.handleClose()
    }
  }, [isJoiningCompletedSelector])

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
