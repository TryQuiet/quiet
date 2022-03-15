import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { useModal } from '../../containers/hooks'
import { ModalName } from '../../sagas/modals/modals.types'
import { socketSelectors } from '../../sagas/socket/socket.selectors'
import { communities, publicChannels } from '@quiet/nectar'
import LoadingPanelComponent from './loadingPanelComponent'

export enum LoadingPanelMessage {
  StartingApplication = 'Starting Quiet',
  FetchingData = 'Fetching Data'
}

const LoadingPanel = () => {
  const [message, setMessage] = useState(LoadingPanelMessage.StartingApplication)

  const loadingPanelModal = useModal(ModalName.loadingPanel)

  const isConnected = useSelector(socketSelectors.isConnected)

  const currentCommunity = useSelector(communities.selectors.currentCommunity)
  const isChannelReplicated = Boolean(
    useSelector(publicChannels.selectors.publicChannels)?.length > 0
  )

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
        setMessage(LoadingPanelMessage.FetchingData)
        loadingPanelModal.handleOpen()
      } else {
        loadingPanelModal.handleClose()
      }
    }
  }, [isConnected, currentCommunity, isChannelReplicated])

  return <LoadingPanelComponent {...loadingPanelModal} message={message} />
}

export default LoadingPanel
