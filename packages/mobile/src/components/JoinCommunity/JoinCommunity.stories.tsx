import { storiesOf } from '@storybook/react-native'
import React from 'react'
import { storybookLog } from '../../utils/functions/storybookLog/storybookLog.function'
import { JoinCommunity } from './JoinCommunity.component'

storiesOf('JoinCommunity', module)
  .add('Default', () => (
    <JoinCommunity
      joinCommunityAction={storybookLog('Opening username registration!')}
      handleBackButton={storybookLog('Navigating to create community')}
      hasReceivedResponse={false}
    />
  ))
  // Link devices → Paste link (user addition, 2026-09-13): device links only; a member link shows the error.
  .add('Paste link (Link devices, device link only)', () => (
    <JoinCommunity
      joinCommunityAction={storybookLog('Linking this device!')}
      handleBackButton={storybookLog('Back to Link devices')}
      hasReceivedResponse={false}
      variant={'pasteDeviceLink'}
    />
  ))
