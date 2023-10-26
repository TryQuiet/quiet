import { storiesOf } from '@storybook/react-native'
import React from 'react'
import { storybookLog } from '../../utils/functions/storybookLog/storybookLog.function'
import { JoinCommunity } from './JoinCommunity.component'

storiesOf('JoinCommunity', module).add('Default', () => (
  <JoinCommunity
    joinCommunityAction={storybookLog('Opening username registration!')}
    redirectionAction={storybookLog('Navigating to create community')}
    networkCreated={false}
  />
))
