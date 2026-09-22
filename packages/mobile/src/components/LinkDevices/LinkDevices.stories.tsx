import { storiesOf } from '@storybook/react-native'
import React from 'react'
import { storybookLog } from '../../utils/functions/storybookLog/storybookLog.function'
import { LinkDevices } from './LinkDevices.component'

const actions = {
  onDisplayQrCode: storybookLog('Display QR code'),
  onCopyLink: storybookLog('Copy link'),
  onScanQrCode: storybookLog('Scan QR code'),
  onPasteLink: storybookLog('Paste link'),
  handleBackButton: storybookLog('Back'),
}

// Link devices (2811:2575; Device-linking file 879:15644 with linked devices, 879:15640 without).
storiesOf('LinkDevices', module)
  .add('In a community (share: Display QR code, Copy link)', () => <LinkDevices {...actions} direction='share' />)
  .add('No community (receive: Scan QR code, Paste link)', () => <LinkDevices {...actions} direction='receive' />)
