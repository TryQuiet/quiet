import React, { FC, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { QrScanner } from '../../components/QrScanner/QrScanner.component'
import { Splash } from '../../components/Splash/Splash.component'
import { ScreenNames } from '../../const/ScreenNames.enum'
import { useInvitationAction } from '../../hooks/useInvitationAction'
import type { PasteInviteLinkVariant, ScanQrCodeVariant } from '../../route.params'
import { initSelectors } from '../../store/init/init.selectors'
import { navigationSelectors } from '../../store/navigation/navigation.selectors'
import { navigationActions } from '../../store/navigation/navigation.slice'
import { ScanQrCodeScreenProps } from './ScanQrCode.types'

interface ScanQrCodeCopy {
  title: string
  intro?: string
  /** The paste form that stands in when the camera cannot be used. */
  pasteVariant: PasteInviteLinkVariant
  testID: string
}

/** Title bar · intro per flow. Copy is the prototype's (sheets 2811:2460 and 2811:2587). */
const COPY: Record<ScanQrCodeVariant, ScanQrCodeCopy> = {
  join: { title: 'Join with QR code', pasteVariant: 'inviteLink', testID: 'join-qr-scanner' },
  deviceLink: {
    title: 'Scan QR code',
    intro: 'Go to “Link devices” on the other device and display the QR code. Scan it to link devices.',
    pasteVariant: 'deviceLink',
    testID: 'link-devices-qr-scanner',
  },
}

/**
 * Join with QR code and Link devices → Scan QR code. A scanned code does exactly
 * what the same link pasted into "Paste a link to Join" does; when the camera
 * cannot be used the sheet gives way to that paste form. The camera runs only
 * while this is the screen in front.
 */
export const ScanQrCodeScreen: FC<ScanQrCodeScreenProps> = ({ route }) => {
  const dispatch = useDispatch()
  const copy = COPY[route.params?.variant ?? 'join']

  const isWebsocketConnected = useSelector(initSelectors.isWebsocketConnected)
  const active = useSelector(navigationSelectors.currentScreen) === ScreenNames.ScanQrCodeScreen

  const onDecoded = useInvitationAction()

  const onClose = useCallback(() => {
    dispatch(navigationActions.pop())
  }, [dispatch])

  const onUsePasteLink = useCallback(() => {
    dispatch(
      navigationActions.replaceScreen({
        screen: ScreenNames.PasteInviteLinkScreen,
        params: { variant: copy.pasteVariant },
      })
    )
  }, [dispatch, copy.pasteVariant])

  if (!isWebsocketConnected) return <Splash />

  return (
    <QrScanner
      title={copy.title}
      intro={copy.intro}
      active={active}
      onDecoded={onDecoded}
      onClose={onClose}
      onUsePasteLink={onUsePasteLink}
      testID={copy.testID}
    />
  )
}
