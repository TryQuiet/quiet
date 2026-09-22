import React, { FC, useCallback, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { communities } from '@quiet/state-manager'
import type { DeviceInvitationData } from '@quiet/types'

import { DeviceLinkConsent } from '../../components/DeviceLinkConsent/DeviceLinkConsent.component'
import { QrScanner } from '../../components/QrScanner/QrScanner.component'
import { Splash } from '../../components/Splash/Splash.component'
import { ScreenNames } from '../../const/ScreenNames.enum'
import { useInvitationAction } from '../../hooks/useInvitationAction'
import type { PasteInviteLinkVariant, ScanQrCodeVariant } from '../../route.params'
import { initSelectors } from '../../store/init/init.selectors'
import { navigationSelectors } from '../../store/navigation/navigation.selectors'
import { navigationActions } from '../../store/navigation/navigation.slice'
import { confirmedDeviceLinkPayload } from '../../utils/deviceLinkConfirmation'
import { createLogger } from '../../utils/logger'
import { ScanQrCodeScreenProps } from './ScanQrCode.types'
import { JOIN_WITH_QR_CODE_HEADING, SCAN_QR_CODE_HEADING, SCAN_QR_CODE_INTRO } from '@quiet/common'

const logger = createLogger('ScanQrCodeScreen')

interface ScanQrCodeCopy {
  title: string
  intro?: string
  /** The paste form that stands in when the camera cannot be used. */
  pasteVariant: PasteInviteLinkVariant
  testID: string
}

/** Title bar · intro per flow. Copy is the prototype's (sheets 2811:2460 and 2811:2587). */
const COPY: Record<ScanQrCodeVariant, ScanQrCodeCopy> = {
  join: { title: JOIN_WITH_QR_CODE_HEADING, pasteVariant: 'inviteLink', testID: 'join-qr-scanner' },
  deviceLink: {
    title: SCAN_QR_CODE_HEADING,
    intro: SCAN_QR_CODE_INTRO,
    pasteVariant: 'deviceLink',
    testID: 'link-devices-qr-scanner',
  },
}

/**
 * Join with QR code and Link devices → Scan QR code. A scanned code does exactly
 * what the same link pasted into "Paste a link to join" does; when the camera
 * cannot be used the sheet gives way to that paste form. The camera runs only
 * while this is the screen in front.
 */
export const ScanQrCodeScreen: FC<ScanQrCodeScreenProps> = ({ route }) => {
  const dispatch = useDispatch()
  const copy = COPY[route.params?.variant ?? 'join']

  const isWebsocketConnected = useSelector(initSelectors.isWebsocketConnected)
  const active = useSelector(navigationSelectors.currentScreen) === ScreenNames.ScanQrCodeScreen

  const [deviceLinkInvite, setDeviceLinkInvite] = useState<DeviceInvitationData | undefined>(undefined)

  // A scanned device link goes through the same consent screen a pasted one
  // does: scanning is not a shortcut around it.
  const onDecoded = useInvitationAction(setDeviceLinkInvite)

  const linkDevice = useCallback(
    (data: DeviceInvitationData) => {
      logger.info('Linking this device from a scanned device link')
      dispatch(communities.actions.linkDevice(confirmedDeviceLinkPayload(data)))
      dispatch(
        navigationActions.replaceScreen({
          screen: ScreenNames.ConnectionProcessScreen,
        })
      )
    },
    [dispatch]
  )

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

  // Agree & join (3054:4090) is a screen of its own, not a sheet over the scanner, the same
  // way PasteInviteLink presents it: it takes the window while the decision is open, and
  // declining returns here, where the camera restarts and the code can be scanned again.
  if (deviceLinkInvite) {
    return (
      <DeviceLinkConsent
        inviteData={deviceLinkInvite}
        visible
        onConfirm={() => linkDevice(deviceLinkInvite)}
        onCancel={() => setDeviceLinkInvite(undefined)}
      />
    )
  }

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
