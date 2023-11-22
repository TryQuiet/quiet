import { RouteProp } from '@react-navigation/core'
import { Dispatch } from 'react'
import { ScreenNames } from './const/ScreenNames.enum'

// eslint-disable-next-line
export type RootStackParamList = {
    [ScreenNames.SplashScreen]: undefined
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
    [ScreenNames.DeleteChannelScreen]: {
        channelName: string
        channelId: string
    }
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
    [ScreenNames.ConnectionProcessScreen]: undefined
    [ScreenNames.DuplicatedUsernameScreen]: undefined

    [ScreenNames.UsernameTakenScreen]: undefined
    [ScreenNames.NewUsernameRequestedScreen]: undefined
    [ScreenNames.PossibleImpersonationAttackScreen]: undefined
}

export type SplashRouteProp = RouteProp<RootStackParamList, ScreenNames.SplashScreen>

export type JoinCommunityRouteProp = RouteProp<RootStackParamList, ScreenNames.JoinCommunityScreen>

export type UsernameRegistrationRouteProps = RouteProp<RootStackParamList, ScreenNames.UsernameRegistrationScreen>

export type DeleteChannelRouteProps = RouteProp<RootStackParamList, ScreenNames.DeleteChannelScreen>

export type SuccessRouteProp = RouteProp<RootStackParamList, ScreenNames.SuccessScreen>

export type ErrorRouteProp = RouteProp<RootStackParamList, ScreenNames.ErrorScreen>

export type DuplicatedUsernameRouteProps = RouteProp<RootStackParamList, ScreenNames.DuplicatedUsernameScreen>

export type UsernameTakenRouteProps = RouteProp<RootStackParamList, ScreenNames.UsernameTakenScreen>

export type NewUsernameRequestedRouteProps = RouteProp<RootStackParamList, ScreenNames.NewUsernameRequestedScreen>
export type PossibleImpersonationAttackRouteProps = RouteProp<
    RootStackParamList,
    ScreenNames.PossibleImpersonationAttackScreen
>
