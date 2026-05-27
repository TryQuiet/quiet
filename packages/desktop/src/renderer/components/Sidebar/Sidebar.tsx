import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useModal } from '../../containers/hooks'
import { useContextMenu } from '../../../hooks/useContextMenu'
import { ModalName } from '../../sagas/modals/modals.types'
import { communities, connection, identity, network, publicChannels, users } from '@quiet/state-manager'
import SidebarComponent from './SidebarComponent'
import { ChannelsPanelProps } from './ChannelsPanel/ChannelsPanel'
import { IdentityPanelProps } from './IdentityPanel/IdentityPanel'
import { UserProfilePanelProps } from './UserProfilePanel/UserProfilePanel'
import { MenuName } from '../../../const/MenuNames.enum'
import { DirectMessagesPanelProps } from './DirectMessagesPanel/DirectMessagesPanel'

const Sidebar = () => {
  const dispatch = useDispatch()

  const createChannelModal = useModal(ModalName.createChannel)
  const accountSettingsModal = useModal(ModalName.accountSettingsModal)

  const userProfileContextMenu = useContextMenu(MenuName.UserProfile)

  const userProfileSelector = useSelector(users.selectors.userProfiles)
  const connectedPeers = useSelector(network.selectors.connectedPeers)
  const unreadChannels = useSelector(publicChannels.selectors.unreadChannels)
  const currentCommunity = useSelector(communities.selectors.currentCommunity)
  const currentChannelId = useSelector(publicChannels.selectors.currentChannelId)
  const currentIdentity = useSelector(identity.selectors.currentIdentity)
  const userProfile = useSelector(users.selectors.myUserProfile)
  const userId = userProfile?.userId || ''

  // Workaround for Redux bug, issue: https://github.com/TryQuiet/quiet/issues/1332
  useSelector(publicChannels.selectors.sortedChannels)
  const publicChannelsSelector = useSelector(publicChannels.selectors.publicChannels)
  const isTorInitialized = useSelector(connection.selectors.isTorInitialized)

  const setCurrentChannel = (id: string) => {
    dispatch(
      publicChannels.actions.setCurrentChannel({
        channelId: id,
      })
    )
  }

  if (!currentCommunity || !currentChannelId) {
    return null
  }

  const identityPanelProps: IdentityPanelProps = {
    currentCommunity: currentCommunity,
    accountSettingsModal: accountSettingsModal,
  }

  const channelsPanelProps: ChannelsPanelProps = {
    channels: publicChannelsSelector,
    userProfiles: userProfileSelector,
    connectedPeers: connectedPeers,
    unreadChannels: unreadChannels,
    setCurrentChannel: setCurrentChannel,
    currentChannelId: currentChannelId,
    createChannelModal: createChannelModal,
    isTorInitialized: isTorInitialized,
  }

  const userProfilePanelProps: UserProfilePanelProps = {
    currentIdentity: currentIdentity,
    userId: userId,
    userProfile: userProfile,
    userProfileContextMenu: userProfileContextMenu,
  }

  const directMessagesPanelProps: DirectMessagesPanelProps = {
    myUserProfile: userProfile,
    userProfiles: userProfileSelector,
    userProfileContextMenu: userProfileContextMenu,
    connectedPeers: connectedPeers,
    isTorInitialized: isTorInitialized,
  }

  return (
    <SidebarComponent
      {...identityPanelProps}
      {...channelsPanelProps}
      {...userProfilePanelProps}
      {...directMessagesPanelProps}
    />
  )
}

export default Sidebar
