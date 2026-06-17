import React, { FC, useCallback, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { communities, publicChannels, users } from '@quiet/state-manager'

import { ChannelMembershipScreenProps } from './ChannelMembership.types'
import { navigationActions } from '../../store/navigation/navigation.slice'
import { ScreenNames } from '../../const/ScreenNames.enum'
import { navigationSelectors } from '../../store/navigation/navigation.selectors'
import { ChannelMembership } from '../../components/ChannelMembership/ChannelMembership.component'
import { UserProfile } from '@quiet/types'
import { createLogger } from '../../utils/logger'

const logger = createLogger('ChannelMembershipScreen')

export const ChannelMembershipScreen: FC<ChannelMembershipScreenProps> = ({ route }) => {
  const dispatch = useDispatch()

  const { channelTitle, channelName, channelId, channelType } = route.params

  const channels = useSelector(publicChannels.selectors.publicChannels)
  const community = useSelector(communities.selectors.currentCommunity)
  const userProfiles = useSelector(users.selectors.userProfiles)
  const isOwner = useSelector(communities.selectors.isOwner)
  const screen = useSelector(navigationSelectors.currentScreen)

  const [members, setMembers] = useState<UserProfile[]>()
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
      logger.warn('User profiles', JSON.stringify(userProfiles, null, 2))
      const currentMembers = Object.values(userProfiles).filter(profile => profile.channels?.includes(channelId))
      logger.warn('Current members', JSON.stringify(currentMembers, null, 2))
      setMembers(currentMembers)
      setMemberCount(currentMembers.length)
    }
  }, [userProfiles, channels, channelId])

  const handleBackButton = useCallback(() => {
    dispatch(
      navigationActions.replaceScreen({
        screen: ScreenNames.ChannelScreen,
      })
    )
  }, [dispatch])

  return (
    <ChannelMembership
      channelTitle={channelTitle}
      channelName={channelName}
      channelId={channelId}
      channelType={channelType}
      community={community}
      userProfiles={userProfiles}
      members={members}
      memberCount={memberCount}
      handleBackButton={handleBackButton}
    />
  )
}
