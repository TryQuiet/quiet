import React, { FC, useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { errors, identity } from '@quiet/state-manager'
import { navigationActions } from '../../store/navigation/navigation.slice'
import { ScreenNames } from '../../const/ScreenNames.enum'
import { UsernameRegistrationScreenProps } from './UsernameRegistration.types'
import { UsernameRegistration } from '../../components/Registration/UsernameRegistration.component'
import { ErrorCodes } from '@quiet/types'

export const UsernameRegistrationScreen: FC<UsernameRegistrationScreenProps> = ({ route }) => {
  const dispatch = useDispatch()

  const fetching = route.params?.fetching

  const currentIdentity = useSelector(identity.selectors.currentIdentity)
  const usernameRegistered = currentIdentity?.userCertificate != null

  const navigation = useCallback(
    (screen: ScreenNames, params?: any) => {
      dispatch(
        navigationActions.navigation({
          screen,
          params,
        })
      )
    },
    [dispatch]
  )

  const handleAction = (nickname: string) => {
    dispatch(identity.actions.registerUsername({ nickname: nickname, isUsernameTaken: false }))
    navigation(ScreenNames.ConnectionProcessScreen)
  }

  return (
    <UsernameRegistration
      registerUsernameAction={handleAction}
      usernameRegistered={usernameRegistered}
      fetching={fetching}
    />
  )
}
