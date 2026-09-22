import { storiesOf } from '@storybook/react-native'
import React from 'react'
import { storybookLog } from '../../utils/functions/storybookLog/storybookLog.function'
import { LinkedDeviceQRCode } from './LinkedDeviceQRCode.component'

// Link devices — QR code (2811:2601) with Copy link in the Add members sheet's button slot (2932:3707).
storiesOf('LinkedDeviceQRCode', module)
  .add('Default', () => (
    <LinkedDeviceQRCode
      value={'https://tryquiet.org/join#p=QmZoiJNAvCffeEHBjk766nLuKVdkxkAT7wfFJDPPLsbKSE&k=example'}
      isLoading={false}
      onCopyLink={storybookLog('Link copied')}
      onReset={storybookLog('Minting a new device link')}
      handleBackButton={storybookLog('Back to Link devices')}
    />
  ))
  .add('Generating the link', () => (
    <LinkedDeviceQRCode
      value={''}
      isLoading
      onCopyLink={storybookLog('Link copied')}
      onReset={storybookLog('Minting a new device link')}
      handleBackButton={storybookLog('Back to Link devices')}
    />
  ))
