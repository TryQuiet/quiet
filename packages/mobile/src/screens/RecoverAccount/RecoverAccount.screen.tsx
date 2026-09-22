import React, { FC, useCallback } from 'react'
import { useDispatch } from 'react-redux'

import { RecoverAccount } from '../../components/RecoverAccount/RecoverAccount.component'
import { ScreenNames } from '../../const/ScreenNames.enum'
import { navigationActions } from '../../store/navigation/navigation.slice'

/** Account recovery, reached from Join community: its two routes are Link devices and Open invite link. */
export const RecoverAccountScreen: FC = () => {
  const dispatch = useDispatch()

  const handleBackButton = useCallback(() => {
    dispatch(navigationActions.pop())
  }, [dispatch])

  const onUseLinkedDevice = useCallback(() => {
    dispatch(navigationActions.navigation({ screen: ScreenNames.LinkDevicesScreen }))
  }, [dispatch])

  const onUseInviteLink = useCallback(() => {
    dispatch(navigationActions.navigation({ screen: ScreenNames.OpenInviteLinkScreen }))
  }, [dispatch])

  return (
    <RecoverAccount
      onUseLinkedDevice={onUseLinkedDevice}
      onUseInviteLink={onUseInviteLink}
      handleBackButton={handleBackButton}
    />
  )
}
