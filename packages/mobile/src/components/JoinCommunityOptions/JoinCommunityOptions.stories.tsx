import { storiesOf } from '@storybook/react-native'
import React from 'react'

import { storybookLog } from '../../utils/functions/storybookLog/storybookLog.function'
import { JoinCommunityOptions } from './JoinCommunityOptions.component'

storiesOf('JoinCommunityOptions', module).add('Default', () => (
  <JoinCommunityOptions
    onJoinWithInviteLink={storybookLog('Join with invite link')}
    onJoinWithQrCode={storybookLog('Join with QR code')}
    onRecoverAccount={storybookLog('Recover account')}
    handleBackButton={storybookLog('Back to Get started')}
  />
))
