import React, { FC, useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { communities, errors, identity } from '@quiet/state-manager'
import { navigationActions } from '../../store/navigation/navigation.slice'
import { ScreenNames } from '../../const/ScreenNames.enum'
import { appImages } from '../../../assets'
import { UsernameRegistration } from '../../components/Registration/UsernameRegistration.component'
import { UsernameRegistrationScreenProps } from './UsernameRegistration.types'

export const UsernameRegistrationScreen: FC<UsernameRegistrationScreenProps> = () => {
  const dispatch = useDispatch()

  const currentIdentity = useSelector(identity.selectors.currentIdentity)

  const registrationAttempts = useSelector(
    communities.selectors.registrationAttempts(currentIdentity?.id)
  )

  const error = useSelector(errors.selectors.registrarErrors)

  const replaceScreen = useCallback((screen: ScreenNames, params?: any) => {
    dispatch(navigationActions.replaceScreen({
      screen: screen,
      params: params
    }))
  }, [dispatch])

  useEffect(() => {
    if (currentIdentity?.userCertificate) {
      replaceScreen(
        ScreenNames.SuccessScreen,
        {
          onPress: () => replaceScreen(ScreenNames.ChannelListScreen),
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
      registerUsernameError={registrationAttempts ? null : error?.message}
    />
  )
}
