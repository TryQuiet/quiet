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
 * opens the scanner sheet; a scanned device link does what a pasted one does.
 */
export const LinkDevicesScreen: FC = () => {
  const dispatch = useDispatch()
  const currentCommunity = useSelector(communities.selectors.currentCommunity)
  const linkedDevices = useSelector(connection.selectors.linkedDevices)

  useEffect(() => {
    dispatch(connection.actions.getLinkedDevices())
  }, [dispatch])

  const handleBackButton = useCallback(() => {
    dispatch(navigationActions.pop())
  }, [dispatch])

  const onDisplayQrCode = useCallback(() => {
    dispatch(navigationActions.navigation({ screen: ScreenNames.LinkedDeviceQRCodeScreen }))
  }, [dispatch])

  const onScanQrCode = useCallback(() => {
    dispatch(
      navigationActions.navigation({
        screen: ScreenNames.ScanQrCodeScreen,
        params: { variant: 'deviceLink' },
      })
    )
  }, [dispatch])

  return (
    <LinkDevices
      onDisplayQrCode={onDisplayQrCode}
      onScanQrCode={onScanQrCode}
      canDisplayQrCode={Boolean(currentCommunity)}
      linkedDevices={linkedDevices}
      handleBackButton={handleBackButton}
    />
  )
}
