import React, { FC, useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { errors, identity } from '@quiet/state-manager'
import { navigationActions } from '../../store/navigation/navigation.slice'
import { ScreenNames } from '../../const/ScreenNames.enum'
import { appImages } from '../../assets'
import { UsernameRegistrationScreenProps } from './UsernameRegistration.types'
import { UsernameRegistration } from '../../components/Registration/UsernameRegistration.component'
import { ErrorCodes } from '@quiet/types'

export const UsernameRegistrationScreen: FC<UsernameRegistrationScreenProps> = ({ route }) => {
  const dispatch = useDispatch()

  const fetching = route.params?.fetching

  const currentIdentity = useSelector(identity.selectors.currentIdentity)
  const usernameRegistered = currentIdentity?.userCertificate != null

  const error = useSelector(errors.selectors.registrarErrors)

  const navigation = useCallback((screen: ScreenNames, params?: any) => {
    dispatch(navigationActions.navigation({
      screen: screen,
      params: params
    }))
  }, [dispatch])

  useEffect(() => {
    if (usernameRegistered) {
      navigation(
        ScreenNames.SuccessScreen,
        {
          onPress: () => navigation(ScreenNames.ChannelListScreen),
          icon: appImages.username_registered,
          title: 'You created a username',
          message: 'Your username will be registered shortly'
        }
      )
    }
  }, [currentIdentity?.userCertificate])

  const handleAction = (nickname: string) => {
    // Clear errors
    if (error) {
      dispatch(
        errors.actions.clearError(error)
      )
    }
    dispatch(identity.actions.registerUsername(nickname))
  }

  return (
    <UsernameRegistration
      registerUsernameAction={handleAction}
      registerUsernameError={error?.code === ErrorCodes.FORBIDDEN ? error.message : undefined}
      usernameRegistered={usernameRegistered}
      fetching={fetching}
    />
  )
}
