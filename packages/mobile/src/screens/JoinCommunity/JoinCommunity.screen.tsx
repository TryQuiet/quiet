import React, { FC, useEffect } from 'react'
import { View } from 'react-native'
import { useDispatch } from 'react-redux'
import { initActions } from '../../store/init/init.slice'
import { ScreenNames } from '../../const/ScreenNames.enum'
import { JoinCommunity } from '../../components/JoinCommunity/JoinCommunity.component'
import { replaceScreen } from '../../utils/functions/replaceScreen/replaceScreen'

export const JoinCommunityScreen: FC = () => {
  const dispatch = useDispatch()

  useEffect(() => {
    dispatch(initActions.setCurrentScreen(ScreenNames.JoinCommunityScreen))
  })

  const openUsernameRegistration = (registrar: string) => {
    replaceScreen(ScreenNames.UsernameRegistrationScreen, {
      registrar: registrar
    })
  }

  return (
    <View style={{ flex: 1 }}>
      <JoinCommunity openUsernameRegistration={openUsernameRegistration} />
    </View>
  )
}
