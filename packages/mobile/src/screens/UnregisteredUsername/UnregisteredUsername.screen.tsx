import React, { FC, useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { navigationActions } from '../../store/navigation/navigation.slice'
import { ScreenNames } from '../../const/ScreenNames.enum'
import { UnregisteredUsernameScreenProps } from './UnregisteredUsername.types'
import UnregisteredUsernameComponent from '../../components/UserLabel/Unregistered/UnregisteredUsername.component'

export const UnregisteredUsernameScreen: FC<UnregisteredUsernameScreenProps> = ({ route }) => {
  const dispatch = useDispatch()

  const { username } = route.params

  const handleBackButton = useCallback(() => {
    dispatch(
      navigationActions.replaceScreen({
        screen: ScreenNames.ChannelScreen,
      })
    )
  }, [dispatch])

  return <UnregisteredUsernameComponent handleBackButton={handleBackButton} username={username} />
}
