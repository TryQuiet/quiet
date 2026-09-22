import React, { FC, useCallback, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { communities, connection } from '@quiet/state-manager'

import { LinkDevices } from '../../components/LinkDevices/LinkDevices.component'
import { ScreenNames } from '../../const/ScreenNames.enum'
import { navigationActions } from '../../store/navigation/navigation.slice'

/**
 * Link devices, reached from Get started (and later from the community menu).
 * "Display QR code" opens #3400's device-link QR screen; it needs a community
 * to mint a link, so the row is disabled until there is one. "Scan QR code"
 * has no scanner on this branch and takes the pasted device link instead. The
 * linked-device list is read off the team graph, so it only shows in a community.
 */
export const LinkDevicesScreen: FC = () => {
  const dispatch = useDispatch()
  const currentCommunity = useSelector(communities.selectors.currentCommunity)
  const linkedDevices = useSelector(connection.selectors.linkedDevices)
  const hasCommunity = Boolean(currentCommunity)

  useEffect(() => {
    if (hasCommunity) dispatch(connection.actions.getLinkedDevices())
  }, [dispatch, hasCommunity])

  const handleBackButton = useCallback(() => {
    dispatch(navigationActions.pop())
  }, [dispatch])

  const onDisplayQrCode = useCallback(() => {
    dispatch(navigationActions.navigation({ screen: ScreenNames.LinkedDeviceQRCodeScreen }))
  }, [dispatch])

  const onScanQrCode = useCallback(() => {
    dispatch(
      navigationActions.navigation({
        screen: ScreenNames.PasteInviteLinkScreen,
        params: { variant: 'deviceLink' },
      })
    )
  }, [dispatch])

  return (
    <LinkDevices
      onDisplayQrCode={onDisplayQrCode}
      onScanQrCode={onScanQrCode}
      canDisplayQrCode={hasCommunity}
      linkedDevices={hasCommunity ? linkedDevices : undefined}
      handleBackButton={handleBackButton}
    />
  )
}
