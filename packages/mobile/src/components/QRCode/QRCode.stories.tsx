import React from 'react'
import { storiesOf } from '@storybook/react-native'

import { storybookLog } from '../../utils/functions/storybookLog/storybookLog.function'

import { QRCode } from './QRCode.component'

storiesOf('QRCode', module).add('Default', () => (
  <QRCode
    value={'https://tryquiet.org/join#'}
    shareCode={storybookLog('Sharing QR code')}
    handleBackButton={storybookLog('Navigating back')}
  />
))
