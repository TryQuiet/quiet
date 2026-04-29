import React, { useState } from 'react'
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
import { generateDmChannelId, getChannelNameFromChannelId } from '@quiet/common'
import { ChannelType, CreateChannelPayload } from '@quiet/types'
import { createLogger } from '../../logger'
import _ from 'lodash'

const logger = createLogger('Sidebar')

const Sidebar = () => {
  const dispatch = useDispatch()

  const createChannelModal = useModal(ModalName.createChannel)
  const accountSettingsModal = useModal(ModalName.accountSettingsModal)

  const userProfileContextMenu = useContextMenu(MenuName.UserProfile)

  const userProfileSelector = useSelector(users.selectors.userProfiles)
  const connectedPeers = useSelector(network.selectors.connectedPeers)
  const unreadChannels = useSelector(publicChannels.selectors.unreadChannels)
  const allChannels = useSelector(publicChannels.selectors.sortedChannels)
  const currentCommunity = useSelector(communities.selectors.currentCommunity)
  const currentChannelId = useSelector(publicChannels.selectors.currentChannelId)
  const generalChannel = useSelector(publicChannels.selectors.generalChannel)
  const currentIdentity = useSelector(identity.selectors.currentIdentity)
  const userProfile = useSelector(users.selectors.myUserProfile)
  const userId = userProfile?.userId || ''

  const publicChannelsSelector = useSelector(publicChannels.selectors.publicChannels)
  const isTorInitialized = useSelector(connection.selectors.isTorInitialized)

  const [newMessageOpen, setNewMessageOpen] = useState<boolean>(false)
  const [prevChannelId, setPrevChannelId] = useState<string | undefined>(currentChannelId)

  const setCurrentChannel = (id: string) => {
    dispatch(
      publicChannels.actions.setCurrentChannel({
        channelId: id,
      })
    )
  }

  const setOrCreateDmChannel = (memberIds: string[]) => {
    const channelId = generateDmChannelId(memberIds)
    logger.info('Checking for existence of DM channel', channelId, memberIds)
    if (allChannels.find(channel => channel.id === channelId)) {
      logger.info('DM channel found')
      dispatch(
        publicChannels.actions.setCurrentChannel({
          channelId,
        })
      )
    } else {
      logger.info('DM channel not found, creating...', channelId, memberIds)
      const payload: CreateChannelPayload = {
        id: channelId,
        name: channelId,
        type: ChannelType.DM,
        description: 'foo',
        public: false,
        memberIds: _.uniq(memberIds),
      }
      dispatch(publicChannels.actions.createChannel(payload))
      dispatch(
        publicChannels.actions.setCurrentChannel({
          channelId,
        })
      )
    }
  }

  const openOrCloseNewMessageWindow = (isOpen: boolean) => {
    setNewMessageOpen(isOpen)
    if (isOpen) {
      setPrevChannelId(currentChannelId)
      dispatch(
        publicChannels.actions.setCurrentChannel({
          channelId: '-1',
        })
      )
      // navigate('/new-message')
    }
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
    setOrCreateDmChannel,
    openOrCloseNewMessageWindow,
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
