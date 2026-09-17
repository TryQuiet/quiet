import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useModal } from '../../containers/hooks'
import { useContextMenu } from '../../../hooks/useContextMenu'
import { ModalName } from '../../sagas/modals/modals.types'
import { communities, connection, identity, publicChannels, users } from '@quiet/state-manager'
import SidebarComponent from './SidebarComponent'
import { ChannelsPanelProps } from './ChannelsPanel/ChannelsPanel'
import { IdentityPanelProps } from './IdentityPanel/IdentityPanel'
import { UserProfilePanelProps } from './UserProfilePanel/UserProfilePanel'
import { MenuName } from '../../../const/MenuNames.enum'
import { DirectMessagesPanelProps } from './DirectMessagesPanel/DirectMessagesPanel'
import { createLogger } from '../../logger'
import _ from 'lodash'

const logger = createLogger('Sidebar')

const Sidebar = () => {
  const dispatch = useDispatch()

  const createChannelModal = useModal(ModalName.createChannel)
  const accountSettingsModal = useModal(ModalName.accountSettingsModal)

  const userProfileContextMenu = useContextMenu(MenuName.UserProfile)

  const userProfileSelector = useSelector(users.selectors.userProfiles)
  const isUserConnected = useSelector(connection.selectors.isUserConnected)
  const unreadChannels = useSelector(publicChannels.selectors.unreadChannels)
  const dmChannels = useSelector(publicChannels.selectors.sortedDmChannels)
  const unreadDms = useSelector(publicChannels.selectors.unreadDms)
  const currentCommunity = useSelector(communities.selectors.currentCommunity)
  const currentChannelId = useSelector(publicChannels.selectors.currentChannelId)
  const currentIdentity = useSelector(identity.selectors.currentIdentity)
  const userProfile = useSelector(users.selectors.myUserProfile)
  const channelPermissions = useSelector(publicChannels.selectors.genericChannelPermissions)
  const canCreateChannel = channelPermissions.public.create
  const canCreatePrivateChannel = channelPermissions.private.create
  const userId = userProfile?.userId || ''

  // sortedChannels orders by `name`, which is what ChannelsListItem renders. The bare
  // publicChannels selector orders by `displayedName`, so the list came out in creation order.
  const publicChannelsSelector = useSelector(publicChannels.selectors.sortedChannels)
  const isTorInitialized = useSelector(connection.selectors.isTorInitialized)

  const setCurrentChannel = (id: string) => {
    dispatch(publicChannels.actions.setNewMessageOpen({ isOpen: false }))
    dispatch(
      publicChannels.actions.setCurrentChannel({
        channelId: id,
      })
    )
  }

  const openNewMessageWindow = () => {
    dispatch(publicChannels.actions.setNewMessageOpen({ isOpen: true, prevChannelId: currentChannelId }))
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
    unreadChannels,
    setCurrentChannel: setCurrentChannel,
    currentChannelId: currentChannelId,
    createChannelModal: createChannelModal,
    canCreateChannel: (canCreateChannel || canCreatePrivateChannel) ?? false,
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
    dmChannels,
    unreadDms,
    currentChannelId,
    isUserConnected,
    isTorInitialized: isTorInitialized,
    setCurrentChannel,
    openNewMessageWindow,
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
