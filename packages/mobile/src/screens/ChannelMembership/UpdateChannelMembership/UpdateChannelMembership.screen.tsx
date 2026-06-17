import React, { FC, useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { communities, publicChannels, users } from '@quiet/state-manager'

import { UpdateChannelMembershipScreenProps } from './UpdateChannelMembership.types'
import { navigationActions } from '../../../store/navigation/navigation.slice'
import { ScreenNames } from '../../../const/ScreenNames.enum'
import { navigationSelectors } from '../../../store/navigation/navigation.selectors'
import { UpdateChannelMembership } from '../../../components/ChannelMembership/UpdateChannelMembership/UpdateChannelMembership.component'

export const UpdateChannelMembershipScreen: FC<UpdateChannelMembershipScreenProps> = ({ route }) => {
  const dispatch = useDispatch()

  const { channelTitle, channelName, channelType, channelId } = route.params

  const channels = useSelector(publicChannels.selectors.publicChannels)
  const community = useSelector(communities.selectors.currentCommunity)
  const userProfiles = useSelector(users.selectors.userProfiles)

  const screen = useSelector(navigationSelectors.currentScreen)

  useEffect(() => {
    if (screen === ScreenNames.UpdateChannelMembershipScreen && !channels.find(c => c.name === channelName)) {
      dispatch(navigationActions.replaceScreen({ screen: ScreenNames.AppHomeScreen }))
    }
  }, [dispatch, screen, channels])

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
    dispatch(
      navigationActions.replaceScreen({
        screen: ScreenNames.ChannelMembershipScreen,
        params: {
          channelId,
          channelName,
        },
      })
    )
  }, [dispatch])

  return (
    <UpdateChannelMembership
      channelTitle={channelTitle}
      channelName={channelName}
      channelType={channelType}
      channelId={channelId}
      community={community}
      userProfiles={userProfiles ?? {}}
      updateChannelMembership={updateChannelMembership}
      handleBackButton={handleBackButton}
    />
  )
}
