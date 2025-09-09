import React, { FC, useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { communities, identity } from '@quiet/state-manager'
import { navigationActions } from '../../store/navigation/navigation.slice'
import { ScreenNames } from '../../const/ScreenNames.enum'
import { UsernameRegistrationScreenProps } from './UsernameRegistration.types'
import { UsernameRegistration } from '../../components/Registration/UsernameRegistration.component'
import { createLogger } from '../../utils/logger'

const logger = createLogger('UsernameRegistrationScreen')

export const UsernameRegistrationScreen: FC<UsernameRegistrationScreenProps> = ({ route }) => {
  const dispatch = useDispatch()

  const fetching = route.params?.fetching

  const currentIdentity = useSelector(identity.selectors.currentIdentity)
  const invitationCodes = useSelector(communities.selectors.invitationCodes)
  const usernameRegistered = Boolean(currentIdentity?.userId)

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
