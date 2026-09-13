import React, { type FC, useCallback, useEffect } from 'react'
import { Platform } from 'react-native'
import Clipboard from '@react-native-clipboard/clipboard'
import { useDispatch, useSelector } from 'react-redux'

import { connection } from '@quiet/state-manager'

import { LinkedDeviceQRCode } from '../../components/LinkedDeviceQRCode/LinkedDeviceQRCode.component'
import { useConfirmationBox } from '../../hooks/useConfirmationBox'
import { navigationActions } from '../../store/navigation/navigation.slice'

/**
 * Link devices → Display QR code: mints a fresh one-time device link when opened and
 * again on Reset QR code; Copy link puts the link on the clipboard and confirms.
 */
export const LinkedDeviceQRCodeScreen: FC = () => {
  const dispatch = useDispatch()
  const deviceLink = useSelector(connection.selectors.deviceLinkUrl)
  const deviceLinkInvite = useSelector(connection.selectors.deviceLinkInvite)
  const confirmationBox = useConfirmationBox('Link copied')

  useEffect(() => {
    dispatch(connection.actions.setDeviceLinkInvite(undefined))
  }, [dispatch])

  useEffect(() => {
    if (!deviceLinkInvite) {
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

  const onReset = useCallback(() => {
    dispatch(connection.actions.setDeviceLinkInvite(undefined))
  }, [dispatch])

  return (
    <LinkedDeviceQRCode
      value={deviceLink}
      isLoading={!deviceLinkInvite}
      onCopyLink={onCopyLink}
      onReset={onReset}
      handleBackButton={handleBackButton}
    />
  )
}
