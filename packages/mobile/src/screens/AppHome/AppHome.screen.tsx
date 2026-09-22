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
        .map(profile => ({
          userId: profile.userId,
          nickname: profile.nickname,
          photo: profile.photo,
          profilePhoto: profile.profilePhoto,
          connected: isUserConnected(profile.userId),
          isMe: me != null && me.userId === profile.userId,
        }))
        .sort((a, b) => a.nickname.localeCompare(b.nickname)),
    [userProfiles, isUserConnected, me]
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
    />
  )
}
