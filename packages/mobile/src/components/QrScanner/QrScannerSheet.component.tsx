import React, { FC } from 'react'
import { StyleSheet, TouchableOpacity, View } from 'react-native'

import { defaultTheme } from '../../styles/themes/default.theme'
import { spacing } from '../../styles/const/spacing'
import { Appbar } from '../Appbar/Appbar.component'
import { INVALID_INVITATION_ERROR } from '../JoinCommunity/JoinCommunity.component'
import { Typography } from '../Typography/Typography.component'

import type { QrScannerSheetProps, QrScannerStatus } from './QrScanner.types'

/** The camera area of the prototype's sheets (2811:2460, 2811:2587): the sheet's full width, 375×384. */
export const VIEWFINDER_ASPECT_RATIO = 375 / 384
/** The framed square the code is held in (≈215 in the frames; desktop uses the same). */
export const TARGET_SIZE = 216

/**
 * Not in the prototype: the sheets show only the camera. The permission-pending,
 * denied and no-camera states are the minimum needed to say what happened and
 * offer the paste field instead; their copy is not the designer's and is the
 * same as desktop's.
 */
export const SCANNER_COPY = {
  requesting: 'Requesting camera access…',
  denied: 'Camera access was denied.',
  unavailable: 'No camera is available.',
  /** The Open invite link frame's own link text. */
  pasteLink: 'Paste a link',
} as const

const BLOCKED: QrScannerStatus[] = ['denied', 'unavailable']

/**
 * Join with QR code (2811:2460) and Scan QR code (2811:2587): close ✕, centred
 * title, the camera edge to edge with the code held in the framed square.
 * Presentational; QrScanner drives it from the camera.
 */
export const QrScannerSheet: FC<QrScannerSheetProps> = ({
  title,
  intro,
  status,
  invalid,
  camera,
  onClose,
  onUsePasteLink,
  testID = 'qr-scanner',
}) => {
  const blocked = BLOCKED.includes(status)
  return (
    <View style={styles.sheet} testID={`${testID}-component`}>
      <Appbar title={title} back={onClose} crossBackIcon />
      {intro ? (
        <View style={styles.intro}>
          <Typography variant={'body'} horizontalTextAlign={'center'}>
            {intro}
          </Typography>
        </View>
      ) : null}
      <View style={styles.viewfinder} testID={`${testID}-viewfinder`} accessibilityValue={{ text: status }}>
        {camera}
        {status === 'scanning' ? <View style={styles.frame} pointerEvents={'none'} testID={`${testID}-frame`} /> : null}
        {status === 'requesting' ? (
          <View style={styles.overlay}>
            <Typography variant={'body'} color={'white'} horizontalTextAlign={'center'}>
              {SCANNER_COPY.requesting}
            </Typography>
          </View>
        ) : null}
        {blocked ? (
          <View style={styles.overlay}>
            <Typography variant={'body'} color={'white'} horizontalTextAlign={'center'} testID={`${testID}-message`}>
              {status === 'denied' ? SCANNER_COPY.denied : SCANNER_COPY.unavailable}
            </Typography>
            <TouchableOpacity onPress={onUsePasteLink} accessibilityRole='button' testID={`${testID}-paste-link`}>
              <Typography variant={'bodyLg'} color={'white'} horizontalTextAlign={'center'}>
                {SCANNER_COPY.pasteLink}
              </Typography>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
      {invalid ? (
        <View style={styles.error}>
          <Typography variant={'body'} color={'error'} horizontalTextAlign={'center'} testID={`${testID}-error`}>
            {INVALID_INVITATION_ERROR}
          </Typography>
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  sheet: { flex: 1, backgroundColor: defaultTheme.palette.background.white },
  intro: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.lg },
  viewfinder: {
    width: '100%',
    aspectRatio: VIEWFINDER_ASPECT_RATIO,
    backgroundColor: defaultTheme.palette.background.black,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  frame: {
    position: 'absolute',
    width: TARGET_SIZE,
    height: TARGET_SIZE,
    borderRadius: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
  error: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
})
