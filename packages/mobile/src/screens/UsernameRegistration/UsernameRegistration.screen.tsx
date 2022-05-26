import React, { FC, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { appImages } from '../../../assets'
import { ScreenNames } from '../../const/ScreenNames.enum'
import { UsernameRegistrationScreenProps } from './UsernameRegistration.types'
import { replaceScreen } from '../../utils/functions/replaceScreen/replaceScreen'
import { initActions } from '../../store/init/init.slice'
import { UsernameRegistration } from '../../components/Registration/UsernameRegistration.component'

import { errors, identity } from '@quiet/state-manager'

export const UsernameRegistrationScreen: FC<UsernameRegistrationScreenProps> = () => {
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(initActions.setCurrentScreen(ScreenNames.UsernameRegistrationScreen))
  })

  const currentIdentity = useSelector(identity.selectors.currentIdentity)

  const error = useSelector(errors.selectors.registrarErrors)

  useEffect(() => {
    if (currentIdentity?.userCertificate) {
      replaceScreen(ScreenNames.SuccessScreen, {
        onPress: () => replaceScreen(ScreenNames.MainScreen),
        icon: appImages.username_registered,
        title: 'You created a username',
        message: 'Your username will be registered shortly'
      })
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
      registerUsernameError={error?.message}
    />
  )
}
