import React, { FC } from 'react'
import { TouchableOpacity, View } from 'react-native'
import QR from 'react-native-qrcode-svg'

import { defaultTheme } from '../../styles/themes/default.theme'
import { spacing } from '../../styles/const/spacing'
import { ActionProgress } from '../ActionProgress/ActionProgress.component'
import { Appbar } from '../Appbar/Appbar.component'
import { Button } from '../Button/Button.component'
import { Typography } from '../Typography/Typography.component'

import type { LinkedDeviceQRCodeProps } from './LinkedDeviceQRCode.types'

/** The library's qr-code-box (5996:24052): 220 square, 1px #B3B3B3, r4, the 188 code inset 16. */
export const QR_BOX_SIZE = 220
export const QR_SIZE = 188

/** Sheet copy (2811:2601), verbatim. */
export const LINKED_DEVICE_QR_COPY = {
  title: 'QR code',
  scan: 'Scan this from “Link devices” on another device to link the devices.',
  copyLink: 'Copy link',
  reset: 'Reset QR code',
  /** While the backend mints the link (#3400's copy; the frame draws no such state) — the ActionProgress status line. */
  generating: 'Generating device link…',
  /**
   * develop's security copy, kept verbatim. It is the only place that says what the link actually
   * is: reusable until it expires, not a one-shot code — and that expiry does not take back keys
   * a linked device already holds. The frame has no such paragraph, and dropping it would leave
   * people to guess at the risk.
   */
  security:
    'Anyone with this private code can link another device until it expires in 30 minutes. Keep it secret, and keep both devices online while linking. Expiry blocks new linking but does not remove keys already received by a linked device.',
  failed: 'Could not generate a device link. Go back and try again.',
} as const

/**
 * Link devices — QR code (2811:2601, 879:15503): the QR in the designed box, the sheet's
 * sentence, then — the user's decision (2026-09-13), in the slot the Add members QR sheet
 * (2932:3707) gives its primary button — Copy link, and Reset QR code as a text link
 * (16/26 #2373EA). The raw link is never shown. While the link is minted the actions give
 * way to the library's progress bar with the status line (ActionProgress, #3518's rule:
 * never a greyed-out button). A full screen with the sheet's content; the sheet itself is
 * a cross-cutting parity item.
 */
export const LinkedDeviceQRCode: FC<LinkedDeviceQRCodeProps> = ({
  value,
  isLoading,
  failed = false,
  onCopyLink,
  onReset,
  handleBackButton,
}) => {
  const ready = Boolean(value)
  return (
    <View
      style={{ flex: 1, backgroundColor: defaultTheme.palette.background.white }}
      testID={'linked-device-qr-code-component'}
    >
      <Appbar title={LINKED_DEVICE_QR_COPY.title} back={handleBackButton} crossBackIcon />
      <View style={{ alignItems: 'center', padding: spacing.lg, gap: spacing.lg }}>
        <View
          style={{
            width: QR_BOX_SIZE,
            height: QR_BOX_SIZE,
            borderWidth: 1,
            borderColor: defaultTheme.palette.border.qrBox,
            borderRadius: spacing.xs,
            backgroundColor: defaultTheme.palette.background.white,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          testID={'linked-device-qr-code-box'}
        >
          {ready ? <QR value={value} size={QR_SIZE} /> : null}
        </View>
        <Typography variant={'body'} horizontalTextAlign={'center'}>
          {LINKED_DEVICE_QR_COPY.scan}
        </Typography>
        <Typography
          variant={'caption'}
          color={'gray50'}
          horizontalTextAlign={'center'}
          testID={'linked-device-qr-code-security'}
        >
          {LINKED_DEVICE_QR_COPY.security}
        </Typography>
        {failed && !ready ? (
          <Typography variant={'body'} horizontalTextAlign={'center'} testID={'linked-device-qr-code-failed'}>
            {LINKED_DEVICE_QR_COPY.failed}
          </Typography>
        ) : null}
        {isLoading && !ready ? (
          <ActionProgress status={LINKED_DEVICE_QR_COPY.generating} testID={'linked-device-qr-code-progress'} />
        ) : null}
        {ready ? (
          <>
            <Button title={LINKED_DEVICE_QR_COPY.copyLink} onPress={onCopyLink} newDesign testID={'copy-device-link'} />
            <TouchableOpacity onPress={onReset} accessibilityRole='button' testID={'reset-qr-code'}>
              <Typography variant={'bodyLg'} color={'blue'} horizontalTextAlign={'center'}>
                {LINKED_DEVICE_QR_COPY.reset}
              </Typography>
            </TouchableOpacity>
          </>
        ) : null}
      </View>
    </View>
  )
}
