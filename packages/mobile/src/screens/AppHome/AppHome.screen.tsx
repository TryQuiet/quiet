import React, { FC, useCallback, useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { communities, connection, identity, publicChannels, users } from '@quiet/state-manager'
import { capitalizeFirstLetter, findDmChannelWithMembers } from '@quiet/common'

import { CommunityHome } from '../../components/CommunityHome/CommunityHome.component'
import { navigationActions } from '../../store/navigation/navigation.slice'
import { ScreenNames } from '../../const/ScreenNames.enum'
import { useContextMenu } from '../../hooks/useContextMenu'
import { MenuName } from '../../const/MenuNames.enum'
import { createLogger } from '../../utils/logger'

import type { CommunityHomeChannel, CommunityHomeUser } from '../../components/CommunityHome/CommunityHome.types'

const logger = createLogger('AppHomeScreen')

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
  const channelPermissions = useSelector(publicChannels.selectors.genericChannelPermissions)
  const allChannels = useSelector(publicChannels.selectors.publicChannels)
  const unreadDms = useSelector(publicChannels.selectors.unreadDms)
  const userProfiles = useSelector(users.selectors.userProfiles)
  const me = useSelector(users.selectors.myUserProfile)
  const isUserConnected = useSelector(connection.selectors.isUserConnected)

  const communityContextMenu = useContextMenu(MenuName.Community)
  const invitationContextMenu = useContextMenu(MenuName.Invitation)

  const openChannel = useCallback(
    (id: string) => {
      dispatch(
        publicChannels.actions.setCurrentChannel({
          channelId: id,
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

  /**
   * The plus on the Direct messages title: the composer with nobody chosen yet, for a conversation
   * with someone who is not on the list below. Opening it is all there is to do — the conversation
   * itself only exists once its first message is sent.
   *
   * Unlike the Channels plus this is not permission-gated. Creating a channel is a community-level
   * act others have to live with; messaging someone is not.
   */
  const startDm = useCallback(() => {
    dispatch(publicChannels.actions.setNewMessageOpen({ isOpen: true }))
    dispatch(navigationActions.navigation({ screen: ScreenNames.ChannelScreen }))
  }, [dispatch])

  /**
   * A DM is created together with its first message, so there is nothing to create here. Either the
   * conversation already exists, in which case open it, or the composer opens with this person
   * already chosen and the message they type is what brings the DM into being. Same path as the
   * user profile screen's Message action.
   */
  const openMember = useCallback(
    (userId: string) => {
      if (me == null) {
        logger.error('Cannot start a DM without knowing who I am')
        return
      }
      const existing = findDmChannelWithMembers([me.userId, userId], allChannels)
      dispatch(
        publicChannels.actions.setCurrentChannel({
          channelId: existing?.id ?? '',
        })
      )
      dispatch(
        publicChannels.actions.setNewMessageOpen({
          isOpen: existing == null,
          recipientIds: existing == null ? [userId] : undefined,
        })
      )
      dispatch(navigationActions.navigation({ screen: ScreenNames.ChannelScreen }))
    },
    [dispatch, me, allChannels]
  )

  /**
   * The Channels section. `channelsStatusSorted` leaves direct messages out — a DM is a channel
   * underneath, but it belongs to the section below under the name of the person in it, not here
   * under its own name of "Direct message".
   */
  const channels: CommunityHomeChannel[] = channelsStatusSorted.map(status => ({
    id: status.id,
    name: status.name,
    isPublic: status.public ?? true,
    unread: status.unread,
  }))

  /**
   * The community's members, as the frame of record draws them. The list
   * includes you: it is the member list, not a list of people to message.
   */
  const members: CommunityHomeUser[] = useMemo(
    () =>
      Object.values(userProfiles ?? {})
        .map(profile => {
          // The conversation with this person, if there is one. Its unread mark belongs on their
          // row, because the conversation itself is never listed as a channel.
          const dm = me != null ? findDmChannelWithMembers([me.userId, profile.userId], allChannels) : undefined
          return {
            userId: profile.userId,
            nickname: profile.nickname,
            photo: profile.photo,
            profilePhoto: profile.profilePhoto,
            connected: isUserConnected(profile.userId),
            isMe: me != null && me.userId === profile.userId,
            unread: dm != null && unreadDms.includes(dm.id),
          }
        })
        .sort((a, b) => a.nickname.localeCompare(b.nickname)),
    [userProfiles, isUserConnected, me, allChannels, unreadDms]
  )

  return (
    <CommunityHome
      communityName={community?.name ? capitalizeFirstLetter(community.name) : '...'}
      channels={channels}
      users={members}
      canCreateChannel={channelPermissions.public.create}
      openCommunityMenu={() => communityContextMenu.handleOpen()}
      addMembers={() => invitationContextMenu.handleOpen()}
      createChannel={createChannel}
      openChannel={openChannel}
      openMember={openMember}
      startDm={startDm}
    />
  )
}
