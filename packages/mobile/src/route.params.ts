import { RouteProp } from '@react-navigation/core'
import { Dispatch } from 'react'
import { ScreenNames } from './const/ScreenNames.enum'
import { UsernameRegistrationScreenProps } from './screens/UsernameRegistration/UsernameRegistration.types'

// eslint-disable-next-line
export type RootStackParamList = {
  [ScreenNames.SplashScreen]: undefined
  [ScreenNames.MainScreen]: undefined
  [ScreenNames.SuccessScreen]: {
    onPress: () => void
    icon: any
    title: string
    message?: string
  }
  [ScreenNames.ErrorScreen]: {
    onPress: (dispatch: Dispatch<any>) => void
    icon: any
    title: string
    message?: string
  },
  [ScreenNames.UsernameRegistrationScreen]: {
    registrar: string
  }
}

export type SuccessRouteProp = RouteProp<
RootStackParamList,
ScreenNames.SuccessScreen
>

export type ErrorRouteProp = RouteProp<
RootStackParamList,
ScreenNames.ErrorScreen
>

export type UsernameRegistrationRouteProp = RouteProp<
RootStackParamList,
ScreenNames.UsernameRegistrationScreen
>
