import React, { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useModal } from '../../containers/hooks'
import { ModalName } from '../../sagas/modals/modals.types'
import { socketSelectors } from '../../sagas/socket/socket.selectors'
import { communities, publicChannels } from '@quiet/nectar'
import LoadingPanelComponent from './loadingPanelComponent'

export enum LoadingPanelMessage {
  Loading = 'Loading...',
  StartingApplication = 'Starting Quiet',
  FetchingData = 'Fetching Data'
}

const LoadingPanel = () => {
  const loadingPanelModal = useModal(ModalName.loadingPanel)

  const isConnected = useSelector(socketSelectors.isConnected)

  const currentCommunity = useSelector(communities.selectors.currentCommunity)
  const isChannelReplicated = Boolean(
    useSelector(publicChannels.selectors.publicChannels)?.length > 0
  )

  let message = LoadingPanelMessage.Loading

  // Set loading message text
  if (!isConnected) {
    message = LoadingPanelMessage.StartingApplication
  }
  if (currentCommunity && !isChannelReplicated) {
    message = LoadingPanelMessage.FetchingData
  }

  // Before connecting websocket
  useEffect(() => {
    if (isConnected) {
      loadingPanelModal.handleClose()
    }
  }, [isConnected])

  // Before replicating data
  useEffect(() => {
    if (isConnected) {
      if (currentCommunity && !isChannelReplicated) {
        loadingPanelModal.handleOpen()
      } else {
        loadingPanelModal.handleClose()
      }
    }
  }, [isConnected, currentCommunity, isChannelReplicated])

  return <LoadingPanelComponent {...loadingPanelModal} message={message} />
}

export default LoadingPanel
