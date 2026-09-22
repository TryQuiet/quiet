import React, { FC, useCallback, useEffect } from 'react'
import { Platform } from 'react-native'
import Clipboard from '@react-native-clipboard/clipboard'
import { useDispatch, useSelector } from 'react-redux'
import { communities, connection } from '@quiet/state-manager'

import { LinkDevices } from '../../components/LinkDevices/LinkDevices.component'
import { ScreenNames } from '../../const/ScreenNames.enum'
import { useConfirmationBox } from '../../hooks/useConfirmationBox'
import { navigationActions } from '../../store/navigation/navigation.slice'

/**
 * Link devices, reached from Get started and from the community menu's Linked devices
 * row — the one full-screen stage both entry points share (Device-linking file, Entry
 * points 879:14680); back returns to wherever it was opened from. Inside a community
 * this device shares: Display QR code opens #3400's device-link QR screen, Copy link
 * copies the same link and confirms. Without one it receives: Scan QR code opens the
 * scanner sheet, where a scanned device link does what a pasted one does, and Paste
 * link opens the same paste step under the Link devices title.
 */
export const LinkDevicesScreen: FC = () => {
  const dispatch = useDispatch()
  const currentCommunity = useSelector(communities.selectors.currentCommunity)
  const deviceLink = useSelector(connection.selectors.deviceLinkUrl)
  const deviceLinkInvite = useSelector(connection.selectors.deviceLinkInvite)
  const confirmationBox = useConfirmationBox('Copied')
  const inCommunity = Boolean(currentCommunity)

  // Share: the link Copy link puts on the clipboard, minted as soon as the screen shows.
  useEffect(() => {
    if (inCommunity && !deviceLinkInvite) dispatch(connection.actions.createDeviceLink())
  }, [inCommunity, deviceLinkInvite, dispatch])

  const handleBackButton = useCallback(() => {
    dispatch(navigationActions.pop())
  }, [dispatch])

  const onDisplayQrCode = useCallback(() => {
    dispatch(navigationActions.navigation({ screen: ScreenNames.LinkedDeviceQRCodeScreen }))
  }, [dispatch])

  const onCopyLink = useCallback(async () => {
    if (!deviceLink) {
      dispatch(connection.actions.createDeviceLink())
      return
    }
    Clipboard.setString(deviceLink)
    // Android 33+ already confirms copied content.
    if (Platform.OS === 'android' && Platform.Version >= 33) return
    await confirmationBox.flash()
  }, [deviceLink, dispatch, confirmationBox])

  const onScanQrCode = useCallback(() => {
    dispatch(
      navigationActions.navigation({
        screen: ScreenNames.ScanQrCodeScreen,
        params: { variant: 'deviceLink' },
      })
    )
  }, [dispatch])

  const onPasteLink = useCallback(() => {
    dispatch(
      navigationActions.navigation({
        screen: ScreenNames.PasteInviteLinkScreen,
        params: { variant: 'pasteDeviceLink' },
      })
    )
  }, [dispatch])

  return (
    <LinkDevices
      direction={inCommunity ? 'share' : 'receive'}
      onDisplayQrCode={onDisplayQrCode}
      onCopyLink={onCopyLink}
      onScanQrCode={onScanQrCode}
      onPasteLink={onPasteLink}
      handleBackButton={handleBackButton}
    />
  )
}
