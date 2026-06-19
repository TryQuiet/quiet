import { storiesOf } from '@storybook/react-native'
import React from 'react'

import { ChannelMembership } from './ChannelMembership.component'

import { createLogger } from '../../utils/logger'

const logger = createLogger('channelMembership:stories')

storiesOf('ChannelMembership', module).add('Default', () => (
  <ChannelMembership
    channelName={'private-channel'}
    channelId={'abc123'}
    userProfiles={{}}
    members={undefined}
    memberCount={undefined}
    handleBackButton={() => {
      logger.info('going back')
    }}
  />
))
