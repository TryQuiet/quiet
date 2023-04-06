import React, { useCallback, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useModal } from '../../containers/hooks'
import { ModalName } from '../../sagas/modals/modals.types'
import { socketSelectors } from '../../sagas/socket/socket.selectors'
import {
  communities,
  publicChannels,
  users,
  identity,
  connection,
  network,
  LoadingPanelType
} from '@quiet/state-manager'
import { modalsActions } from '../../sagas/modals/modals.slice'
import { shell } from 'electron'
import JoiningPanelComponent from './JoiningPanelComponent'
import StartingPanelComponent from './StartingPanelComponent'

const LoadingPanel = () => {
  const dispatch = useDispatch()
  const message = useSelector(network.selectors.loadingPanelType)
  const loadingPanelModal = useModal(ModalName.loadingPanel)

  const isConnected = useSelector(socketSelectors.isConnected)

  const currentCommunity = useSelector(communities.selectors.currentCommunity)
  const isChannelReplicated = Boolean(
    useSelector(publicChannels.selectors.publicChannels)?.length > 0
  )

  const currentChannelDisplayableMessages = useSelector(
    publicChannels.selectors.currentChannelMessagesMergedBySender
  )

  const community = useSelector(communities.selectors.currentCommunity)
  const owner = Boolean(community?.CA)

  const currentIdentity = useSelector(identity.selectors.currentIdentity)
  const usersData = Object.keys(useSelector(users.selectors.certificates))
  const isOnlyOneUser = usersData.length === 1

  const torBootstrapProcessSelector = useSelector(connection.selectors.torBootstrapProcess)
  const torConnectionProcessSelector = useSelector(connection.selectors.torConnectionProcess)
  const areMessagesLoaded = Object.values(currentChannelDisplayableMessages).length > 0

  const communityId = useSelector(communities.selectors.currentCommunityId)
  const initializedCommunities = useSelector(network.selectors.initializedCommunities)
  const isCommunityInitialized = Boolean(initializedCommunities[communityId])

  useEffect(() => {
    console.log('HUNTING for haisenbug:')
    console.log('isConnected', isConnected)
    console.log('isChannelReplicated', isChannelReplicated)
    console.log('currentCommunity', currentCommunity)
    console.log('currentIdentity', currentIdentity)
    console.log('currentIdentity.userCertificate', currentIdentity?.userCertificate)
    if (isConnected && isCommunityInitialized && areMessagesLoaded) {
      loadingPanelModal.handleClose()
    }
  }, [isConnected, torBootstrapProcessSelector, isCommunityInitialized, areMessagesLoaded])

  useEffect(() => {
    if (isConnected) {
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

  if (message === LoadingPanelType.StartingApplication) {
    return (
      <StartingPanelComponent
        {...loadingPanelModal}
        message={message}
        torBootstrapInfo={torBootstrapProcessSelector}
      />
    )
  } else {
    return (
      <JoiningPanelComponent
        {...loadingPanelModal}
        openUrl={openUrl}
        torConnectionInfo={torConnectionProcessSelector}
      />
    )
  }
}

export default LoadingPanel
