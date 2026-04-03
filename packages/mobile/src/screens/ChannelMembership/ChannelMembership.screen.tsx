import React, { FC, useCallback, useEffect } from 'react'
import { ChannelMembershipScreenProps } from './ChannelMembership.types'
import { DeleteChannel } from '../../components/DeleteChannel/DeleteChannel.component'
import { useDispatch, useSelector } from 'react-redux'
import { navigationActions } from '../../store/navigation/navigation.slice'
import { ScreenNames } from '../../const/ScreenNames.enum'
import { communities, publicChannels, users } from '@quiet/state-manager'
import { navigationSelectors } from '../../store/navigation/navigation.selectors'
import { ChannelMembership } from '../../components/ChannelMembership/ChannelMembership.component'

export const ChannelMembershipScreen: FC<ChannelMembershipScreenProps> = ({ route }) => {
  const dispatch = useDispatch()

  const { channelName, channelId } = route.params

  const channels = useSelector(publicChannels.selectors.publicChannels)
  const userProfiles = useSelector(users.selectors.userProfiles)
  const community = useSelector(communities.selectors.currentCommunity)

  const screen = useSelector(navigationSelectors.currentScreen)

  useEffect(() => {
    if (screen === ScreenNames.ChannelMembershipScreen && !channels.find(c => c.name === channelName)) {
      dispatch(navigationActions.replaceScreen({ screen: ScreenNames.ChannelListScreen }))
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
      dispatch(navigationActions.replaceScreen({ screen: ScreenNames.ChannelScreen }))
    },
    [dispatch, channelId, channelName]
  )

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
      updateChannelMembership={updateChannelMembership}
      handleBackButton={handleBackButton}
    />
  )
}
