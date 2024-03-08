import { RouteProp } from '@react-navigation/core'
import { Dispatch } from 'react'
import { ScreenNames } from './const/ScreenNames.enum'

// eslint-disable-next-line
export type RootStackParamList = {
  [ScreenNames.JoinCommunityScreen]: {
    code?: string
  }
  [ScreenNames.QRCodeScreen]: undefined
  [ScreenNames.LeaveCommunityScreen]: undefined
  [ScreenNames.CreateCommunityScreen]: undefined
  [ScreenNames.UsernameRegistrationScreen]:
    | {
        fetching: boolean
      }
    | undefined
  [ScreenNames.ChannelListScreen]: undefined
  [ScreenNames.ChannelScreen]: undefined
  [ScreenNames.CreateChannelScreen]: undefined
  [ScreenNames.CreateCommunityScreen]: undefined
  [ScreenNames.ConnectionProcessScreen]: undefined
  [ScreenNames.DeleteChannelScreen]: {
    channelName: string
    channelId: string
  }
  [ScreenNames.ErrorScreen]: {
    onPress: (dispatch: Dispatch<any>) => void
    icon: any
    title: string
    message?: string
  }
  [ScreenNames.ConnectionProcessScreen]: undefined
  [ScreenNames.DuplicatedUsernameScreen]: undefined

  [ScreenNames.UsernameTakenScreen]: undefined
  [ScreenNames.NewUsernameRequestedScreen]: undefined
  [ScreenNames.PossibleImpersonationAttackScreen]: undefined
  [ScreenNames.JoinCommunityScreen]: {
    code?: string
  }
  [ScreenNames.LeaveCommunityScreen]: undefined
  [ScreenNames.NotifierScreen]: undefined
  [ScreenNames.QRCodeScreen]: undefined
  [ScreenNames.SplashScreen]: {
    code?: string
  }
  [ScreenNames.SuccessScreen]: {
    onPress: () => void
    icon: any
    title: string
    message?: string
  }
  [ScreenNames.UsernameRegistrationScreen]:
    | {
        fetching: boolean
      }
    | undefined
}

export type DeleteChannelRouteProps = RouteProp<RootStackParamList, ScreenNames.DeleteChannelScreen>

export type ErrorRouteProp = RouteProp<RootStackParamList, ScreenNames.ErrorScreen>

export type JoinCommunityRouteProp = RouteProp<RootStackParamList, ScreenNames.JoinCommunityScreen>

export type SplashRouteProp = RouteProp<RootStackParamList, ScreenNames.SplashScreen>

export type SuccessRouteProp = RouteProp<RootStackParamList, ScreenNames.SuccessScreen>

export type DuplicatedUsernameRouteProps = RouteProp<RootStackParamList, ScreenNames.DuplicatedUsernameScreen>

export type UsernameTakenRouteProps = RouteProp<RootStackParamList, ScreenNames.UsernameTakenScreen>

export type NewUsernameRequestedRouteProps = RouteProp<RootStackParamList, ScreenNames.NewUsernameRequestedScreen>
export type PossibleImpersonationAttackRouteProps = RouteProp<
  RootStackParamList,
  ScreenNames.PossibleImpersonationAttackScreen
>
export type UsernameRegistrationRouteProps = RouteProp<RootStackParamList, ScreenNames.UsernameRegistrationScreen>
