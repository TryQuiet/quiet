import React, { FC, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { GetStarted } from '../../components/GetStarted/GetStarted.component'
import { Splash } from '../../components/Splash/Splash.component'
import { ScreenNames } from '../../const/ScreenNames.enum'
import { initSelectors } from '../../store/init/init.selectors'
import { navigationActions } from '../../store/navigation/navigation.slice'

/** Onboarding entry: where the app lands while it has no community. */
export const GetStartedScreen: FC = () => {
  const dispatch = useDispatch()
  const isWebsocketConnected = useSelector(initSelectors.isWebsocketConnected)

  const go = useCallback(
    (screen: ScreenNames) => () => {
      dispatch(navigationActions.navigation({ screen }))
    },
    [dispatch]
  )

  if (!isWebsocketConnected) return <Splash />

  return (
    <GetStarted
      onJoinCommunity={go(ScreenNames.JoinCommunityScreen)}
      onCreateCommunity={go(ScreenNames.CreateCommunityScreen)}
      onLinkDevices={go(ScreenNames.LinkDevicesScreen)}
    />
  )
}
