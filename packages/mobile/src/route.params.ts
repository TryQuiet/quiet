import { RouteProp } from '@react-navigation/core'
import { Dispatch } from 'react'
import { ScreenNames } from './const/ScreenNames.enum'

// eslint-disable-next-line
export type RootStackParamList = {
  [ScreenNames.SplashScreen]: {
    code?: string
  }
  [ScreenNames.JoinCommunityScreen]: {
    code?: string
  }
  [ScreenNames.CreateCommunityScreen]: undefined
  [ScreenNames.ChannelListScreen]: undefined
  [ScreenNames.ChannelScreen]: undefined
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
  }
}

export type SplashRouteProp = RouteProp<
RootStackParamList,
ScreenNames.SplashScreen
>

export type JoinCommunityRouteProp = RouteProp<
RootStackParamList,
ScreenNames.JoinCommunityScreen
>

export type SuccessRouteProp = RouteProp<
RootStackParamList,
ScreenNames.SuccessScreen
>

export type ErrorRouteProp = RouteProp<
RootStackParamList,
ScreenNames.ErrorScreen
>
