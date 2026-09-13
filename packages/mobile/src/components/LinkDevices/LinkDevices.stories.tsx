import { storiesOf } from '@storybook/react-native'
import React from 'react'
import { storybookLog } from '../../utils/functions/storybookLog/storybookLog.function'
import { LinkDevices } from './LinkDevices.component'

const actions = {
  onDisplayQrCode: storybookLog('Display QR code'),
  onScanQrCode: storybookLog('Scan QR code'),
  onPasteLink: storybookLog('Paste link'),
  handleBackButton: storybookLog('Back'),
}

// Link devices (2811:2575; Device-linking file 879:15644 with linked devices, 879:15640 without).
storiesOf('LinkDevices', module)
  .add('In app, with linked devices', () => (
    <LinkDevices
      {...actions}
      linkedDevices={[
        { deviceId: 'this', deviceName: 'this phone', isCurrent: true },
        { deviceId: 'laptop', deviceName: 'nyc-laptop', isCurrent: false },
        { deviceId: 'old', deviceName: 'old-phone', isCurrent: false, removedAt: 1 },
      ]}
    />
  ))
  .add('In app, without linked devices', () => <LinkDevices {...actions} linkedDevices={[]} />)
  .add('From Get started (no community)', () => (
    <LinkDevices {...actions} canDisplayQrCode={false} linkedDevices={[]} />
  ))
