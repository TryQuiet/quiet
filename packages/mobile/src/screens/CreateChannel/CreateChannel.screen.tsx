import React, { FC, useState, useCallback, useEffect } from 'react'
import { CreateChannel } from '../../components/CreateChannel/CreateChannel.component'
import { useDispatch, useSelector } from 'react-redux'
import {
  communities,
  identity,
  publicChannels,
  errors,
  ErrorCodes,
  ErrorMessages,
  PublicChannel,
  SocketActionTypes
} from '@quiet/state-manager'
import { DateTime } from 'luxon'
import { navigationSelectors } from '../../store/navigation/navigation.selectors'
import { ScreenNames } from '../../const/ScreenNames.enum'
import { navigationActions } from '../../store/navigation/navigation.slice'
import { generateChannelAddress } from '@quiet/common'

export const CreateChannelScreen: FC = () => {
  const dispatch = useDispatch()

  const [channel, setChannel] = useState<string>(null)
  const [clearComponent, setClearComponent] = useState<boolean>(false) // How to clear component without using screen's state?

  const user = useSelector(identity.selectors.currentIdentity)
  const community = useSelector(communities.selectors.currentCommunity)
  const channels = useSelector(publicChannels.selectors.publicChannels)

  const communityErrors = useSelector(errors.selectors.currentCommunityErrors)
  const error = communityErrors[SocketActionTypes.CREATED_CHANNEL]

  const currentScreen = useSelector(navigationSelectors.currentScreen)

  useEffect(() => {
    if (
      currentScreen === ScreenNames.CreateChannelScreen &&
      channels.filter(_channel => _channel.name === channel).length > 0
    ) {
      dispatch(
        publicChannels.actions.setCurrentChannel({
          channelAddress: channel
        })
      )
      setChannel(null)
      dispatch(navigationActions.replaceScreen({ screen: ScreenNames.ChannelScreen }))
    }
  }, [dispatch, channels])

  useEffect(() => {
    clearErrors()
    setClearComponent(true)
  }, [currentScreen])

  const clearErrors = () => {
    if (error) {
      dispatch(errors.actions.clearError(error))
    }
  }

  const createChannelAction = useCallback(
    (name: string) => {
      clearErrors()

      // Validate channel name
      if (channels.some(channel => channel.name === name)) {
        dispatch(
          errors.actions.addError({
            type: SocketActionTypes.CREATED_CHANNEL,
            code: ErrorCodes.FORBIDDEN,
            message: ErrorMessages.CHANNEL_NAME_TAKEN,
            community: community.id
          })
        )
        return
      }

      // Create channel
      const channel: PublicChannel = {
        name: name,
        description: `Welcome to #${name}`,
        owner: user.nickname,
        address: generateChannelAddress(name),
        timestamp: DateTime.utc().valueOf()
      }

      setChannel(name)

      dispatch(
        publicChannels.actions.createChannel({
          channel: channel
        })
      )
    },
    [dispatch]
  )

  const handleBackButton = useCallback(() => {
    dispatch(
      navigationActions.navigation({
        screen: ScreenNames.ChannelListScreen
      })
    )
  }, [dispatch])

  return (
    <CreateChannel
      createChannelAction={createChannelAction}
      channelCreationError={error?.message}
      clearComponent={clearComponent}
      handleBackButton={handleBackButton}
    />
  )
}
