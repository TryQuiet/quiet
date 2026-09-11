import React, { FC, useCallback } from 'react'
import { useDispatch } from 'react-redux'

import { JoinCommunityOptions } from '../../components/JoinCommunityOptions/JoinCommunityOptions.component'
import { ScreenNames } from '../../const/ScreenNames.enum'
import { navigationActions } from '../../store/navigation/navigation.slice'
import { JoinCommunityScreenProps } from './JoinCommunity.types'

/**
 * Join community: the three-way choice. Without a scanner on this branch,
 * "Join with QR code" takes the link the camera would have read.
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
        screen: ScreenNames.PasteInviteLinkScreen,
        params: { variant: 'qrCode' },
      })
    )
  }, [dispatch])

  return (
    <JoinCommunityOptions
      onJoinWithInviteLink={onJoinWithInviteLink}
      onJoinWithQrCode={onJoinWithQrCode}
      handleBackButton={handleBackButton}
    />
  )
}
