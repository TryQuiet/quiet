import React, { FC, useCallback, useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { communities, identity, publicChannels, users } from '@quiet/state-manager'
import { capitalizeFirstLetter } from '@quiet/common'

import { CommunityHome } from '../../components/CommunityHome/CommunityHome.component'
import { navigationActions } from '../../store/navigation/navigation.slice'
import { ScreenNames } from '../../const/ScreenNames.enum'
import { useContextMenu } from '../../hooks/useContextMenu'
import { MenuName } from '../../const/MenuNames.enum'

import type { CommunityHomeChannel, CommunityHomeUser } from '../../components/CommunityHome/CommunityHome.types'

export const ChannelListScreen: FC = () => {
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
  const userProfiles = useSelector(users.selectors.userProfiles)

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

  const channels: CommunityHomeChannel[] = channelsStatusSorted.map(status => ({
    id: status.id,
    name: status.name,
    isPublic: status.public ?? true,
    unread: status.unread,
  }))

  // Quiet has no direct messages, so the design's "Direct messages" section
  // lists the community's members instead.
  const members: CommunityHomeUser[] = useMemo(
    () =>
      Object.values(userProfiles ?? {})
        .map(profile => ({
          userId: profile.userId,
          nickname: profile.nickname,
          photo: profile.photo,
          profilePhoto: profile.profilePhoto,
        }))
        .sort((a, b) => a.nickname.localeCompare(b.nickname)),
    [userProfiles]
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
    />
  )
}
