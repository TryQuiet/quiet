import React, { FC, useCallback } from 'react'
import { useDispatch } from 'react-redux'

import { JoinCommunityOptions } from '../../components/JoinCommunityOptions/JoinCommunityOptions.component'
import { ScreenNames } from '../../const/ScreenNames.enum'
import { navigationActions } from '../../store/navigation/navigation.slice'
import { JoinCommunityScreenProps } from './JoinCommunity.types'

/**
 * Join community: the three-way choice. "Join with QR code" opens the scanner
 * sheet; a scanned code does what the same link pasted does.
 */
export const JoinCommunityScreen: FC<JoinCommunityScreenProps> = () => {
  const dispatch = useDispatch()

  const handleBackButton = useCallback(() => {
    dispatch(navigationActions.pop())
  }, [dispatch])

  const onJoinWithInviteLink = useCallback(() => {
    dispatch(navigationActions.navigation({ screen: ScreenNames.OpenInviteLinkScreen }))
  }, [dispatch])

  const onJoinWithQrCode = useCallback(() => {
    dispatch(
      navigationActions.navigation({
        screen: ScreenNames.ScanQrCodeScreen,
        params: { variant: 'join' },
      })
    )
  }, [dispatch])

  const onRecoverAccount = useCallback(() => {
    dispatch(navigationActions.navigation({ screen: ScreenNames.RecoverAccountScreen }))
  }, [dispatch])

  return (
    <JoinCommunityOptions
      onJoinWithInviteLink={onJoinWithInviteLink}
      onJoinWithQrCode={onJoinWithQrCode}
      onRecoverAccount={onRecoverAccount}
      handleBackButton={handleBackButton}
    />
  )
}
