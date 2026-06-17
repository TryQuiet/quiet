import { storiesOf } from '@storybook/react-native'
import React from 'react'

import { UpdateChannelMembership } from './UpdateChannelMembership.component'

import { createLogger } from '../../../utils/logger'

const logger = createLogger('channelMembership:stories')

storiesOf('UpdateChannelMembership', module).add('Default', () => (
  <UpdateChannelMembership
    channelName={'private-channel'}
    channelId={'abc123'}
    userProfiles={{}}
    updateChannelMembership={(memberIds: string[]) => {
      logger.info('updating channel membership')
    }}
    handleBackButton={() => {
      logger.info('going back')
    }}
  />
))
