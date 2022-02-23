import React, { FC, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { appImages } from '../../../assets'
import { ScreenNames } from '../../const/ScreenNames.enum'
import { UsernameRegistrationScreenProps } from './UsernameRegistration.types'
import { replaceScreen } from '../../utils/functions/replaceScreen/replaceScreen'
import { initActions } from '../../store/init/init.slice'
import { Registration } from '../../components/Registration/Registration.component'

import { communities, errors, identity, SocketActionTypes } from '@quiet/nectar'

export const UsernameRegistrationScreen: FC<UsernameRegistrationScreenProps> = ({ registrar }) => {
  const dispatch = useDispatch()

  const [username, setUsername] = useState('')

  useEffect(() => {
    dispatch(initActions.setCurrentScreen(ScreenNames.UsernameRegistrationScreen))
  })

  const currentIdentity = useSelector(identity.selectors.currentIdentity)

  const communityErrors = useSelector(errors.selectors.currentCommunityErrors)
  const error = communityErrors[SocketActionTypes.REGISTRAR]

  useEffect(() => {
    if (currentIdentity?.userCertificate !== null) {
      replaceScreen(ScreenNames.SuccessScreen, {
        onPress: () => replaceScreen(ScreenNames.MainScreen),
        icon: appImages.username_registered,
        title: 'You created a username',
        message: 'Your username will be registered shortly'
      })
    }
  }, [currentIdentity])

  const handleAction = (username: string) => {
    setUsername(username)
    if (registrar) {
      dispatch(communities.actions.joinCommunity(registrar))
    }
  }

  useEffect(() => {
    if (currentIdentity?.hiddenService && !currentIdentity.userCertificate) {
      dispatch(identity.actions.registerUsername(username))
    }
  }, [currentIdentity])

  useEffect(() => {
    if (currentIdentity?.userCertificate) {
      replaceScreen(ScreenNames.MainScreen)
    }
  }, [currentIdentity])

  return (
    <Registration
      registerUsernameAction={handleAction}
      registerUsernameError={error?.message}
    />
  )
}
