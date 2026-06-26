import React, { useEffect, useMemo, useState } from 'react'
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
import { PublicChannel } from '@quiet/types'

const CHANNEL_ORDER_STORAGE_KEY = 'quiet.sidebar.channelOrder'

const readStoredOrder = (storageKey: string): string[] => {
  try {
    const storedOrder = localStorage.getItem(storageKey)
    return storedOrder ? JSON.parse(storedOrder) : []
  } catch {
    return []
  }
}

const orderChannels = <T extends PublicChannel>(channels: T[], channelOrder: string[]): T[] => {
  if (channelOrder.length === 0) return channels

  const orderIndex = new Map(channelOrder.map((channelId, index) => [channelId, index]))
  const orderedChannels = channels
    .filter(channel => orderIndex.has(channel.id))
    .sort((a, b) => orderIndex.get(a.id)! - orderIndex.get(b.id)!)
  const unorderedChannels = channels.filter(channel => !orderIndex.has(channel.id))

  return [...orderedChannels, ...unorderedChannels]
}

const Sidebar = () => {
  const dispatch = useDispatch()
  const [channelOrder, setChannelOrder] = useState<string[]>(() => readStoredOrder(CHANNEL_ORDER_STORAGE_KEY))

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
  const canCreateChannel = useSelector(publicChannels.selectors.canCreateChannel)
  const userId = userProfile?.userId || ''

  // Workaround for Redux bug, issue: https://github.com/TryQuiet/quiet/issues/1332
  useSelector(publicChannels.selectors.sortedChannels)
  const publicChannelsSelector = useSelector(publicChannels.selectors.publicChannels)
  const orderedChannels = useMemo(
    () => orderChannels(publicChannelsSelector, channelOrder),
    [publicChannelsSelector, channelOrder]
  )
  const isTorInitialized = useSelector(connection.selectors.isTorInitialized)

  useEffect(() => {
    localStorage.setItem(CHANNEL_ORDER_STORAGE_KEY, JSON.stringify(channelOrder))
  }, [channelOrder])

  const setCurrentChannel = (id: string) => {
    dispatch(
      publicChannels.actions.setCurrentChannel({
        channelId: id,
      })
    )
  }

  const reorderChannels = (channelIds: string[]) => {
    setChannelOrder(channelIds)
  }

  if (!currentCommunity || !currentChannelId) {
    return null
  }

  const identityPanelProps: IdentityPanelProps = {
    currentCommunity: currentCommunity,
    accountSettingsModal: accountSettingsModal,
  }

  const channelsPanelProps: ChannelsPanelProps = {
    channels: orderedChannels,
    userProfiles: userProfileSelector,
    connectedPeers: connectedPeers,
    unreadChannels: unreadChannels,
    setCurrentChannel: setCurrentChannel,
    reorderChannels: reorderChannels,
    currentChannelId: currentChannelId,
    createChannelModal: createChannelModal,
    isTorInitialized: isTorInitialized,
    canCreateChannel: canCreateChannel,
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
