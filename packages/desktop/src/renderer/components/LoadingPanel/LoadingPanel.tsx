import React, { useCallback, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useModal } from '../../containers/hooks'
import { ModalName } from '../../sagas/modals/modals.types'
import { socketSelectors } from '../../sagas/socket/socket.selectors'
import { communities, publicChannels, users, identity, connection } from '@quiet/state-manager'
import LoadingPanelComponent from './LoadingPanelComponent'
import { modalsActions } from '../../sagas/modals/modals.slice'
import { shell } from 'electron'
import JoiningPanelComponent from './JoiningPanelComponent'
import StartingPanelComponent from './StartingPanelComponent'

export enum LoadingPanelMessage {
  StartingApplication = 'Starting Quiet',
  Joining = 'Connecting to peers'
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

  const torBootstrapProcessSelector = useSelector(connection.selectors.torBootstrapProcess)
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
        setMessage(LoadingPanelMessage.Joining)
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

  const openUrl = useCallback((url: string) => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    shell.openExternal(url)
  }, [])
  console.log({ torBootstrapProcessSelector })
  if (message === LoadingPanelMessage.StartingApplication) {
    return <StartingPanelComponent {...loadingPanelModal} message={torBootstrapProcessSelector} torBootstrapInfo={torBootstrapProcessSelector} />
  } else {
    return <JoiningPanelComponent {...loadingPanelModal} openUrl={openUrl} message={message} />
  }

  // return <StartingPanelComponent {...loadingPanelModal} message={message} />
}

export default LoadingPanel
