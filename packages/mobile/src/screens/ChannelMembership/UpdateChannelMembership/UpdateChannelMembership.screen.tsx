import React, { FC, useCallback, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { communities, connection, publicChannels, users } from '@quiet/state-manager'

import { UpdateChannelMembershipScreenProps } from './UpdateChannelMembership.types'
import { navigationActions } from '../../../store/navigation/navigation.slice'
import { ScreenNames } from '../../../const/ScreenNames.enum'
import { navigationSelectors } from '../../../store/navigation/navigation.selectors'
import { UpdateChannelMembership } from '../../../components/ChannelMembership/UpdateChannelMembership/UpdateChannelMembership.component'
import type { DmChannelUserData } from '../../../components/ProfilePhoto/ProfilePhoto.types'
import { getChannelNonMembers } from '../../../utils/functions/channelMembers/channelMembers'

export const UpdateChannelMembershipScreen: FC<UpdateChannelMembershipScreenProps> = ({ route }) => {
  const dispatch = useDispatch()

  const { channelTitle, channelName, channelType, channelId, channelIsPublic } = route.params

  const channels = useSelector(publicChannels.selectors.publicChannels)
  const community = useSelector(communities.selectors.currentCommunity)
  const userProfiles = useSelector(users.selectors.userProfiles)
  const isUserConnected = useSelector(connection.selectors.isUserConnected)
  const me = useSelector(users.selectors.myUserProfile)

  const screen = useSelector(navigationSelectors.currentScreen)

  const [nonMembers, setNonMembers] = useState<Record<string, DmChannelUserData>>({})

  useEffect(() => {
    if (screen === ScreenNames.UpdateChannelMembershipScreen && !channels.find(c => c.name === channelName)) {
      setNonMembers({})
      dispatch(navigationActions.replaceScreen({ screen: ScreenNames.AppHomeScreen }))
    }
  }, [dispatch, screen, channels])

  useEffect(() => {
    if (screen === ScreenNames.UpdateChannelMembershipScreen && userProfiles != null) {
      // The community minus this channel's members, by the same rule the list and the counts use.
      const currentNonMembers = getChannelNonMembers(
        channels.find(channel => channel.id === channelId),
        userProfiles
      )
      const nonMemberData: { [userId: string]: DmChannelUserData } = {}
      currentNonMembers.forEach(user => {
        nonMemberData[user.userId] = {
          connected: (me != null && me.userId === user.userId) || isUserConnected(user.userId),
          user,
        } as DmChannelUserData
      })
      setNonMembers(nonMemberData)
    }
  }, [userProfiles, channels, isUserConnected, me])

  const updateChannelMembershipInner = (memberIds: string[]) => {
    if (!channelId || !channelName) return
    if (memberIds.length === 0) return
    dispatch(
      publicChannels.actions.addMembersChannel({
        channelId,
        channelName,
        memberIds,
      })
    )
  }

  const updateChannelMembership = useCallback(
    (memberIds: string[]) => {
      updateChannelMembershipInner(memberIds)
      dispatch(
        navigationActions.replaceScreen({
          screen: ScreenNames.ChannelMembershipScreen,
          params: {
            channelId,
            channelName,
          },
        })
      )
    },
    [dispatch, channelId, channelName]
  )

  const handleBackButton = useCallback(() => {
    // Pop rather than replace, so the membership screen keeps the params it was opened with —
    // replacing it re-mounted it without channelTitle or channelType.
    dispatch(navigationActions.pop())
  }, [dispatch])

  return (
    <UpdateChannelMembership
      channelTitle={channelTitle}
      channelName={channelName}
      channelType={channelType}
      channelIsPublic={channelIsPublic}
      channelId={channelId}
      community={community}
      nonMembers={nonMembers}
      updateChannelMembership={updateChannelMembership}
      handleBackButton={handleBackButton}
    />
  )
}
