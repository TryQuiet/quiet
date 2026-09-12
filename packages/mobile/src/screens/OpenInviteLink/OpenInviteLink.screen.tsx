import React, { FC, useCallback } from 'react'
import { useDispatch } from 'react-redux'

import { OpenInviteLink } from '../../components/OpenInviteLink/OpenInviteLink.component'
import { ScreenNames } from '../../const/ScreenNames.enum'
import { navigationActions } from '../../store/navigation/navigation.slice'

export const OpenInviteLinkScreen: FC = () => {
  const dispatch = useDispatch()

  const handleBackButton = useCallback(() => {
    dispatch(navigationActions.pop())
  }, [dispatch])

  const onPasteLink = useCallback(() => {
    dispatch(
      navigationActions.navigation({
        screen: ScreenNames.PasteInviteLinkScreen,
        params: { variant: 'inviteLink' },
      })
    )
  }, [dispatch])

  return <OpenInviteLink onPasteLink={onPasteLink} handleBackButton={handleBackButton} />
}
