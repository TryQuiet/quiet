import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useModal } from '../../containers/hooks'
import { ModalName } from '../../sagas/modals/modals.types'
import { socketSelectors } from '../../sagas/socket/socket.selectors'
import { communities, publicChannels, users, identity } from '@quiet/state-manager'
import LoadingPanelComponent from './LoadingPanelComponent'
import { modalsActions } from '../../sagas/modals/modals.slice'

export enum LoadingPanelMessage {
  StartingApplication = 'Starting Quiet',
  Connecting = 'Connecting to peers'
}

const LoadingPanel = () => {
  const [message, setMessage] = useState(LoadingPanelMessage.StartingApplication)
  const dispatch = useDispatch()

  const loadingPanelModal = useModal(ModalName.loadingPanel)

  const isConnected = useSelector(socketSelectors.isConnected)

  const currentCommunity = useSelector(communities.selectors.currentCommunity)
  const isChannelReplicated = Boolean(
    useSelector(publicChannels.selectors.publicChannels)?.length > 0
  )

  const community = useSelector(communities.selectors.currentCommunity)
  const owner = Boolean(community?.CA)

  const currentIdentity = useSelector(identity.selectors.currentIdentity)

  const usersData = Object.keys(useSelector(users.selectors.certificates))
  const isOnlyOneUser = usersData.length === 1

  // Before connecting websocket
  useEffect(() => {
    if (isConnected) {
      loadingPanelModal.handleClose()
    }
  }, [isConnected])

  // Before replicating data
  useEffect(() => {
    console.log('HUNTING for haisenbug:')
    console.log('isConnected', isConnected)
    console.log('isChannelReplicated', isChannelReplicated)
    console.log('currentCommunity', currentCommunity)
    console.log('currentIdentity', currentIdentity)
    console.log('currentIdentity.userCertificate', currentIdentity?.userCertificate)
    if (isConnected) {
      if (currentCommunity && !isChannelReplicated && currentIdentity?.userCertificate) {
        setMessage(LoadingPanelMessage.Connecting)
        loadingPanelModal.handleOpen()
      } else {
        loadingPanelModal.handleClose()
      }

      if (currentCommunity && isChannelReplicated && owner && isOnlyOneUser) {
        const notification = new Notification('Community created!', {
          body: 'Visit Settings for an invite code you can share.',
          icon: '../../build' + '/icon.png',
          silent: true
        })

        notification.onclick = () => {
          dispatch(modalsActions.openModal({ name: ModalName.accountSettingsModal }))
        }
      }
    }
  }, [isConnected, currentCommunity, isChannelReplicated])

  return <LoadingPanelComponent {...loadingPanelModal} message={message} />
}

export default LoadingPanel
