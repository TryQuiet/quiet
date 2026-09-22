import { RouteProp } from '@react-navigation/core'
import { Dispatch } from 'react'
import { ScreenNames } from './const/ScreenNames.enum'
import { Community, InvitationData, UserProfile, type ChannelType } from '@quiet/types'

/**
 * Which flow the paste screen belongs to; it sets the heading and the intro.
 * `deviceLink` (the scanner's fallback) and `pasteDeviceLink` (the Paste link
 * row on Link devices) accept device links only.
 */
export type PasteInviteLinkVariant = 'inviteLink' | 'deviceLink' | 'pasteDeviceLink'

/** Which flow the scanner sheet belongs to: Join with QR code, or Link devices → Scan QR code. */
export type ScanQrCodeVariant = 'join' | 'deviceLink'

// eslint-disable-next-line
export type RootStackParamList = {
  [ScreenNames.GetStartedScreen]: undefined
  [ScreenNames.OpenInviteLinkScreen]: undefined
  [ScreenNames.PasteInviteLinkScreen]:
    | {
        code?: string
        variant?: PasteInviteLinkVariant
      }
    | undefined
  [ScreenNames.RecoverAccountScreen]: undefined
  [ScreenNames.LinkDevicesScreen]: undefined
  [ScreenNames.ScanQrCodeScreen]: {
    variant: ScanQrCodeVariant
  }
  [ScreenNames.JoinCommunityScreen]: {
    code?: string
  }
  [ScreenNames.TermsOfServiceScreen]:
    | {
        inviteData?: InvitationData
        communityName?: string
        nickname?: string
      }
    | undefined
  [ScreenNames.QRCodeScreen]: undefined
  [ScreenNames.LinkedDeviceQRCodeScreen]: undefined
  [ScreenNames.LeaveCommunityScreen]: undefined
  [ScreenNames.CreateCommunityScreen]: undefined
  [ScreenNames.AppHomeScreen]: undefined
  [ScreenNames.ChannelScreen]: undefined
  [ScreenNames.CreateChannelScreen]: undefined
  [ScreenNames.CreateCommunityScreen]: undefined
  [ScreenNames.DeleteChannelScreen]: {
    channelName: string
    channelId: string
  }
  [ScreenNames.ChannelMembershipScreen]: {
    channelName: string
    channelTitle: string
    channelId: string
    channelType: ChannelType
    // Whether the channel is public, which decides the glyph beside its name: the design's '#'
    // for a public channel, a padlock for a private one (Figma PVQ1Kjf6Cq8ng1czuVtvR8, 838:9190).
    channelIsPublic?: boolean
    // Which of the two side-nav entries opened this screen: Permissions, which can change who
    // belongs to the channel, or Members, which only lists them. Defaults to Permissions when the
    // viewer is allowed to manage membership.
    manageMembership?: boolean
  }
  [ScreenNames.UpdateChannelMembershipScreen]: {
    channelTitle: string
    channelType: ChannelType
    channelName: string
    channelId: string
    channelIsPublic?: boolean
  }
  [ScreenNames.UserProfileScreen]: {
    userId: string
  }
  [ScreenNames.ErrorScreen]: {
    onPress: (dispatch: Dispatch<any>) => void
    icon: any
    title: string
    message?: string
    buttonTitle?: string
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
  [ScreenNames.UsernameRegistrationScreen]: undefined
}

export type DeleteChannelRouteProps = RouteProp<RootStackParamList, ScreenNames.DeleteChannelScreen>

export type ChannelMembershipRouteProps = RouteProp<RootStackParamList, ScreenNames.ChannelMembershipScreen>

export type UpdateChannelMembershipRouteProps = RouteProp<RootStackParamList, ScreenNames.UpdateChannelMembershipScreen>

export type UserProfileRouteProps = RouteProp<RootStackParamList, ScreenNames.UserProfileScreen>

export type ErrorRouteProp = RouteProp<RootStackParamList, ScreenNames.ErrorScreen>

export type JoinCommunityRouteProp = RouteProp<RootStackParamList, ScreenNames.JoinCommunityScreen>

export type PasteInviteLinkRouteProp = RouteProp<RootStackParamList, ScreenNames.PasteInviteLinkScreen>

export type ScanQrCodeRouteProp = RouteProp<RootStackParamList, ScreenNames.ScanQrCodeScreen>

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

export type TermsOfServiceRouteProps = RouteProp<RootStackParamList, ScreenNames.TermsOfServiceScreen>
