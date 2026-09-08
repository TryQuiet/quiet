import React, { FC, useCallback, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { communities, publicChannels, users } from '@quiet/state-manager'

import { ChannelMembershipScreenProps } from './ChannelMembership.types'
import { navigationActions } from '../../store/navigation/navigation.slice'
import { ScreenNames } from '../../const/ScreenNames.enum'
import { navigationSelectors } from '../../store/navigation/navigation.selectors'
import { ChannelMembership } from '../../components/ChannelMembership/ChannelMembership.component'
import { UserProfile } from '@quiet/types'

export const ChannelMembershipScreen: FC<ChannelMembershipScreenProps> = ({ route }) => {
  const dispatch = useDispatch()

  const { channelName, channelId } = route.params

  const channels = useSelector(publicChannels.selectors.publicChannels)
  const community = useSelector(communities.selectors.currentCommunity)
  const userProfiles = useSelector(users.selectors.userProfiles)
  const screen = useSelector(navigationSelectors.currentScreen)
  const currentChannelPermissions = useSelector(publicChannels.selectors.currentChannelPermissions)

  const [members, setMembers] = useState<UserProfile[]>()
  const [memberCount, setMemberCount] = useState<number>()

  useEffect(() => {
    if (screen === ScreenNames.ChannelMembershipScreen && !channels.find(c => c.name === channelName)) {
      dispatch(navigationActions.replaceScreen({ screen: ScreenNames.ChannelListScreen }))
      setMembers(undefined)
      setMemberCount(undefined)
    }
  }, [dispatch, screen, channels])

  useEffect(() => {
    if (screen === ScreenNames.ChannelMembershipScreen && userProfiles != null) {
      const currentMembers = Object.values(userProfiles).filter(profile => profile.channels?.includes(channelId))
      setMembers(currentMembers)
      setMemberCount(currentMembers.length)
    }
  }, [userProfiles])

  const handleBackButton = useCallback(() => {
    dispatch(
      navigationActions.replaceScreen({
        screen: ScreenNames.ChannelScreen,
      })
    )
  }, [dispatch])

  return (
    <ChannelMembership
      channelName={channelName}
      channelId={channelId}
      community={community}
      userProfiles={userProfiles}
      members={members}
      memberCount={memberCount}
      handleBackButton={handleBackButton}
      canAddMembers={currentChannelPermissions?.addMembers ?? false}
    />
  )
}
