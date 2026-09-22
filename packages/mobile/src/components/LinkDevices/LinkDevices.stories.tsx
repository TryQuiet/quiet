import { storiesOf } from '@storybook/react-native'
import React from 'react'
import { storybookLog } from '../../utils/functions/storybookLog/storybookLog.function'
import { LinkDevices } from './LinkDevices.component'
import { PASTE_LINK_LABEL, SCAN_QR_CODE_HEADING } from '@quiet/common'

const actions = {
  onDisplayQrCode: storybookLog('Display QR code'),
  onCopyLink: storybookLog('Copy link'),
  onScanQrCode: storybookLog(SCAN_QR_CODE_HEADING),
  onPasteLink: storybookLog(PASTE_LINK_LABEL),
  handleBackButton: storybookLog('Back'),
}

const linkedDevices = [
  { deviceId: 'this', deviceName: 'this device', isCurrent: true },
  { deviceId: 'laptop', deviceName: 'nyc-laptop', isCurrent: false },
  { deviceId: 'phone', deviceName: 'work-phone', isCurrent: false },
]

// Link devices (2811:2575; Device-linking file 879:15644 with linked devices, 879:15640 without).
storiesOf('LinkDevices', module)
  .add('In a community (share: Display QR code, Copy link)', () => (
    <LinkDevices {...actions} direction='share' linkedDevices={linkedDevices} />
  ))
  .add('In a community, nothing linked yet', () => <LinkDevices {...actions} direction='share' linkedDevices={[]} />)
  .add('In a community, device list not read yet', () => <LinkDevices {...actions} direction='share' />)
  .add('No community (receive: Scan QR code, Paste link)', () => <LinkDevices {...actions} direction='receive' />)
