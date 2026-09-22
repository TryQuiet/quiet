import { storiesOf } from '@storybook/react-native'
import React from 'react'
import { StyleSheet, View } from 'react-native'

import { storybookLog } from '../../utils/functions/storybookLog/storybookLog.function'
import { QrScanner } from './QrScanner.component'
import { QrScannerSheet } from './QrScannerSheet.component'
import type { QrScannerStatus } from './QrScanner.types'
import { JOIN_WITH_QR_CODE_HEADING, SCAN_QR_CODE_HEADING, SCAN_QR_CODE_INTRO } from '@quiet/common'

/** Stands in for the camera preview: a dark surface with nothing in it. */
const MockCamera = () => (
  <View style={[StyleSheet.absoluteFill, { backgroundColor: '#202020' }]} testID={'mock-camera'} />
)

const JOIN = { title: JOIN_WITH_QR_CODE_HEADING }
const LINK = {
  title: SCAN_QR_CODE_HEADING,
  intro: SCAN_QR_CODE_INTRO,
}

const sheet = (copy: typeof LINK | typeof JOIN, status: QrScannerStatus, invalid = false) =>
  function Story() {
    const hasCamera = status === 'scanning' || status === 'stopped'
    return (
      <QrScannerSheet
        {...copy}
        status={status}
        invalid={invalid}
        camera={hasCamera ? <MockCamera /> : undefined}
        onClose={storybookLog('Closing the scanner sheet')}
        onUsePasteLink={storybookLog('Opening the paste field instead')}
      />
    )
  }

storiesOf('QrScanner', module)
  .add('Join with QR code · scanning', sheet(JOIN, 'scanning'))
  .add('Join with QR code · requesting camera access', sheet(JOIN, 'requesting'))
  .add('Join with QR code · invalid code', sheet(JOIN, 'scanning', true))
  .add('Join with QR code · camera denied', sheet(JOIN, 'denied'))
  .add('Join with QR code · no camera', sheet(JOIN, 'unavailable'))
  .add('Join with QR code · decoded', sheet(JOIN, 'stopped'))
  .add('Scan QR code (Link devices) · scanning', sheet(LINK, 'scanning'))
  .add('Scan QR code (Link devices) · invalid code', sheet(LINK, 'scanning', true))
  .add('Scan QR code (Link devices) · camera denied', sheet(LINK, 'denied'))
  .add('Live camera (device only)', () => (
    <QrScanner
      {...JOIN}
      onDecoded={storybookLog('Decoded a Quiet invitation')}
      onClose={storybookLog('Closing the scanner sheet')}
      onUsePasteLink={storybookLog('Opening the paste field instead')}
    />
  ))
