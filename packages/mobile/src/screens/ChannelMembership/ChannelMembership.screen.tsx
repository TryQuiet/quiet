import React, { FC, useCallback, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { communities, connection, publicChannels, users } from '@quiet/state-manager'

import { ChannelMembershipScreenProps } from './ChannelMembership.types'
import { navigationActions } from '../../store/navigation/navigation.slice'
import { ScreenNames } from '../../const/ScreenNames.enum'
import { navigationSelectors } from '../../store/navigation/navigation.selectors'
import { ChannelMembership } from '../../components/ChannelMembership/ChannelMembership.component'
import { createLogger } from '../../utils/logger'
import { getChannelMembers } from '../../utils/functions/channelMembers/channelMembers'
import type { DmChannelUserData } from '../../components/ProfilePhoto/ProfilePhoto.types'

const logger = createLogger('ChannelMembershipScreen')

export const ChannelMembershipScreen: FC<ChannelMembershipScreenProps> = ({ route }) => {
  const dispatch = useDispatch()

  const { channelTitle, channelName, channelId, channelType, channelIsPublic, manageMembership } = route.params

  const channels = useSelector(publicChannels.selectors.publicChannels)
  const community = useSelector(communities.selectors.currentCommunity)
  const userProfiles = useSelector(users.selectors.userProfiles)
  const screen = useSelector(navigationSelectors.currentScreen)
  const currentChannelPermissions = useSelector(publicChannels.selectors.currentChannelPermissions)
  const isUserConnected = useSelector(connection.selectors.isUserConnected)
  const me = useSelector(users.selectors.myUserProfile)

  const [members, setMembers] = useState<DmChannelUserData[]>()
  const [memberCount, setMemberCount] = useState<number>()

  useEffect(() => {
    if (screen === ScreenNames.ChannelMembershipScreen && !channels.find(c => c.id === channelId)) {
      dispatch(navigationActions.replaceScreen({ screen: ScreenNames.AppHomeScreen }))
      setMembers(undefined)
      setMemberCount(undefined)
    }
  }, [dispatch, screen, channels])

  useEffect(() => {
    if (screen === ScreenNames.ChannelMembershipScreen && userProfiles != null) {
      const descriptor = channels.find(channel => channel.id === channelId)
      // Shared with the menu and the top bar; this used to filter on profile.channels with no
      // public branch, so a public channel listed nobody while the bar above said the whole
      // community.
      const currentMembers = getChannelMembers(descriptor, userProfiles)
      const memberData = currentMembers.map(
        user =>
          ({
            connected:
              (me != null && me.userId === user.userId) ||
              isUserConnected(user.userId),
            user,
          }) as DmChannelUserData
      )
      setMembers(memberData)
      setMemberCount(memberData.length)
    }
  }, [userProfiles, channels, isUserConnected, me])

  const openUserProfile = useCallback(
    (userId: string) => {
      dispatch(navigationActions.navigation({ screen: ScreenNames.UserProfileScreen, params: { userId } }))
    },
    [dispatch]
  )

  const handleBackButton = useCallback(() => {
    // Pop back to the channel this was opened from rather than replacing the entry.
    dispatch(navigationActions.pop())
  }, [dispatch])

  return (
    <ChannelMembership
      channelTitle={channelTitle}
      channelName={channelName}
      channelId={channelId}
      channelType={channelType}
      channelIsPublic={channelIsPublic}
      community={community}
      userProfiles={userProfiles}
      members={members}
      memberCount={memberCount}
      handleBackButton={handleBackButton}
      openUserProfile={openUserProfile}
      // The side nav offers Members and Permissions as separate entries; only the Permissions
      // entry opens this screen in its editable form. Absent that param, fall back to what the
      // viewer is permitted to do.
      canAddMembers={manageMembership === false ? false : (currentChannelPermissions?.addMembers ?? false)}
    />
  )
}
