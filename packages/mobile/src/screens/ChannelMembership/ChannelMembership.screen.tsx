import React, { FC, useCallback, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { communities, network, publicChannels, users } from '@quiet/state-manager'

import { ChannelMembershipScreenProps } from './ChannelMembership.types'
import { navigationActions } from '../../store/navigation/navigation.slice'
import { ScreenNames } from '../../const/ScreenNames.enum'
import { navigationSelectors } from '../../store/navigation/navigation.selectors'
import { ChannelMembership } from '../../components/ChannelMembership/ChannelMembership.component'
import { createLogger } from '../../utils/logger'
import type { DmChannelUserData } from '../../components/ProfilePhoto/ProfilePhoto.types'

const logger = createLogger('ChannelMembershipScreen')

export const ChannelMembershipScreen: FC<ChannelMembershipScreenProps> = ({ route }) => {
  const dispatch = useDispatch()

  const { channelTitle, channelName, channelId, channelType } = route.params

  const channels = useSelector(publicChannels.selectors.publicChannels)
  const community = useSelector(communities.selectors.currentCommunity)
  const userProfiles = useSelector(users.selectors.userProfiles)
  const isOwner = useSelector(communities.selectors.isOwner)
  const screen = useSelector(navigationSelectors.currentScreen)
  const connectedPeers = useSelector(network.selectors.connectedPeers)
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
      const currentMembers = Object.values(userProfiles).filter(profile => profile.channels?.includes(channelId))
      const memberData = currentMembers.map(
        user =>
          ({
            connected:
              (me != null && me.userId === user.userId) ||
              (user.userData != null && connectedPeers.includes(user.userData.peerId)),
            user,
          } as DmChannelUserData)
      )
      setMembers(memberData)
      setMemberCount(memberData.length)
    }
  }, [userProfiles, channels, connectedPeers, me])

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
