import React, { FC, useCallback } from 'react'
import { DeleteChannelScreenProps } from './DeleteChannel.types'
import { DeleteChannel } from '../../components/DeleteChannel/DeleteChannel.component'
import { useDispatch } from 'react-redux'
import { navigationActions } from '../../store/navigation/navigation.slice'
import { ScreenNames } from '../../const/ScreenNames.enum'

export const DeleteChannelScreen: FC<DeleteChannelScreenProps> = ({ route }) => {
  const dispatch = useDispatch()

  const { channel } = route.params

  const deleteChannel = useCallback(() => {
    console.log('deleting channel', channel)
  }, [dispatch])

  const handleBackButton = useCallback(() => {
    dispatch(
      navigationActions.replaceScreen({
        screen: ScreenNames.ChannelListScreen
      })
    )
  }, [dispatch])

  return (
    <DeleteChannel
      name={channel}
      deleteChannel={deleteChannel}
      handleBackButton={handleBackButton}
    />
  )
}
