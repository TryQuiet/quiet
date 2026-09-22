import React, { FC, useCallback, useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { communities, connection, identity, publicChannels, users } from '@quiet/state-manager'
import { capitalizeFirstLetter } from '@quiet/common'
import { EMPTY_CHANNEL_ID } from '@quiet/types'

import { CommunityHome } from '../../components/CommunityHome/CommunityHome.component'
import { getUserData } from '../../components/ProfilePhoto/ProfilePhotoWithBadge.component'
import { navigationActions } from '../../store/navigation/navigation.slice'
import { ScreenNames } from '../../const/ScreenNames.enum'
import { useContextMenu } from '../../hooks/useContextMenu'
import { MenuName } from '../../const/MenuNames.enum'

import type { CommunityHomeChannel, CommunityHomeConversation } from '../../components/CommunityHome/CommunityHome.types'

export const AppHomeScreen: FC = () => {
  const dispatch = useDispatch()

  const usernameTaken = useSelector(identity.selectors.usernameTaken)

  useEffect(() => {
    if (usernameTaken) {
      dispatch(
        navigationActions.navigation({
          screen: ScreenNames.UsernameTakenScreen,
        })
      )
    }
  }, [dispatch, usernameTaken])

  const community = useSelector(communities.selectors.currentCommunity)
  const channelsStatusSorted = useSelector(publicChannels.selectors.channelsStatusSorted)
  const channelsStatus = useSelector(publicChannels.selectors.channelsStatus)
  const channelPermissions = useSelector(publicChannels.selectors.genericChannelPermissions)
  const dmChannels = useSelector(publicChannels.selectors.sortedDmChannels)
  const userProfiles = useSelector(users.selectors.userProfiles)
  const me = useSelector(users.selectors.myUserProfile)
  const isUserConnected = useSelector(connection.selectors.isUserConnected)
  const isTorInitialized = useSelector(connection.selectors.isTorInitialized)

  const communityContextMenu = useContextMenu(MenuName.Community)
  const invitationContextMenu = useContextMenu(MenuName.Invitation)

  const openChannel = useCallback(
    (id: string, newChat = false) => {
      dispatch(
        publicChannels.actions.setCurrentChannel({
          channelId: id,
        })
      )
      dispatch(
        publicChannels.actions.setNewMessageOpen({
          isOpen: newChat,
        })
      )
      dispatch(
        navigationActions.navigation({
          screen: ScreenNames.ChannelScreen,
        })
      )
    },
    [dispatch]
  )

  const createChannel = useCallback(() => {
    dispatch(
      navigationActions.navigation({
        screen: ScreenNames.CreateChannelScreen,
      })
    )
  }, [dispatch])

  /** The compose control on the Direct messages section opens an empty conversation. */
  const createDm = useCallback(() => {
    openChannel(EMPTY_CHANNEL_ID, true)
  }, [openChannel])

  const channels: CommunityHomeChannel[] = channelsStatusSorted.map(status => ({
    id: status.id,
    name: status.name,
    isPublic: status.public ?? true,
    unread: status.unread,
  }))

  /**
   * The design's "Direct messages" section. Quiet has direct messages now, so
   * these rows are the user's conversations, not a roster of members: each one
   * opens its channel, and the avatar carries the other person's presence.
   */
  const conversations: CommunityHomeConversation[] = useMemo(
    () =>
      dmChannels.map(channel => ({
        id: channel.id,
        name: channel.displayedName,
        unread: channelsStatus[channel.id]?.unread ?? false,
        userData: getUserData(channel, isUserConnected, isTorInitialized, userProfiles, me),
        channel,
        isMe: me != null && me.nickname === channel.displayedName,
      })),
    [dmChannels, channelsStatus, isUserConnected, isTorInitialized, userProfiles, me]
  )

  return (
    <CommunityHome
      communityName={community?.name ? capitalizeFirstLetter(community.name) : '...'}
      channels={channels}
      conversations={conversations}
      canCreateChannel={channelPermissions.public.create}
      openCommunityMenu={() => communityContextMenu.handleOpen()}
      addMembers={() => invitationContextMenu.handleOpen()}
      createChannel={createChannel}
      createDm={createDm}
      openChannel={openChannel}
    />
  )
}
