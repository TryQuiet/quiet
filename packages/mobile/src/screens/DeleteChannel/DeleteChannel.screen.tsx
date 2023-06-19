import React, { FC, useCallback, useEffect } from 'react'
import { DeleteChannelScreenProps } from './DeleteChannel.types'
import { DeleteChannel } from '../../components/DeleteChannel/DeleteChannel.component'
import { useDispatch, useSelector } from 'react-redux'
import { navigationActions } from '../../store/navigation/navigation.slice'
import { ScreenNames } from '../../const/ScreenNames.enum'
import { publicChannels } from '@quiet/state-manager'
import { navigationSelectors } from '../../store/navigation/navigation.selectors'

export const DeleteChannelScreen: FC<DeleteChannelScreenProps> = ({ route }) => {
  const dispatch = useDispatch()

  const { channelName, channelId } = route.params

  const channels = useSelector(publicChannels.selectors.publicChannels)

  const screen = useSelector(navigationSelectors.currentScreen)

  useEffect(() => {
    if (screen === ScreenNames.DeleteChannelScreen && !channels.find(c => c.name === channelName)) {
      dispatch(navigationActions.replaceScreen({ screen: ScreenNames.ChannelListScreen }))
    }
  }, [dispatch, screen, channels])

  const deleteChannel = useCallback(() => {
    dispatch(
      publicChannels.actions.deleteChannel({
        channelId
      })
    )
  }, [dispatch, channels, channelName])

  const handleBackButton = useCallback(() => {
    dispatch(
      navigationActions.replaceScreen({
        screen: ScreenNames.ChannelListScreen
      })
    )
  }, [dispatch])

  return (
    <DeleteChannel
      name={channelName}
      deleteChannel={deleteChannel}
      handleBackButton={handleBackButton}
    />
  )
}
