import React, { type FC, useCallback, useEffect, useRef } from 'react'
import { Platform } from 'react-native'
import Clipboard from '@react-native-clipboard/clipboard'
import { useDispatch, useSelector } from 'react-redux'

import { connection } from '@quiet/state-manager'

import { LinkedDeviceQRCode } from '../../components/LinkedDeviceQRCode/LinkedDeviceQRCode.component'
import { useConfirmationBox } from '../../hooks/useConfirmationBox'
import { navigationActions } from '../../store/navigation/navigation.slice'

/**
 * Link devices → Display QR code. Copy link puts the link on the clipboard and confirms.
 *
 * A device link is reusable until it expires, so opening this screen does not throw the current
 * one away: an unexpired invite is shown again, and a new one is minted only when there is none,
 * when it has expired, or when the user asks for one with Reset QR code. Minting on every open
 * would invalidate a link the user had already sent to their other device.
 */
export const LinkedDeviceQRCodeScreen: FC = () => {
  const dispatch = useDispatch()
  const deviceLink = useSelector(connection.selectors.deviceLinkUrl)
  const deviceLinkInvite = useSelector(connection.selectors.deviceLinkInvite)
  const deviceLinkCreationFailed = useSelector(connection.selectors.deviceLinkCreationFailed)
  const confirmationBox = useConfirmationBox('Link copied')
  const handledCurrentOpen = useRef(false)

  useEffect(() => {
    if (handledCurrentOpen.current) return
    handledCurrentOpen.current = true
    if (!deviceLinkInvite || deviceLinkInvite.expiresAt <= Date.now()) {
      dispatch(connection.actions.createDeviceLink())
    }
  }, [deviceLinkInvite, dispatch])

  const handleBackButton = useCallback(() => {
    dispatch(navigationActions.pop())
  }, [dispatch])

  const onCopyLink = useCallback(async () => {
    if (!deviceLink) return
    Clipboard.setString(deviceLink)
    // Android 33+ already confirms copied content.
    if (Platform.OS === 'android' && Platform.Version >= 33) return
    await confirmationBox.flash()
  }, [deviceLink, confirmationBox])

  // Reset QR code is the deliberate way to invalidate the current link and mint another.
  const onReset = useCallback(() => {
    dispatch(connection.actions.setDeviceLinkInvite(undefined))
    dispatch(connection.actions.createDeviceLink())
  }, [dispatch])

  return (
    <LinkedDeviceQRCode
      value={deviceLink}
      isLoading={!deviceLink && !deviceLinkCreationFailed}
      failed={deviceLinkCreationFailed}
      onCopyLink={onCopyLink}
      onReset={onReset}
      handleBackButton={handleBackButton}
    />
  )
}
