import { storiesOf } from '@storybook/react-native'
import React from 'react'

import { ChannelMembership } from './ChannelMembership.component'

import { createLogger } from '../../utils/logger'
import { ChannelType } from '@quiet/types'

const logger = createLogger('channelMembership:stories')

storiesOf('ChannelMembership', module).add('Default', () => (
  <ChannelMembership
    channelTitle={'private-channel'}
    channelName={'private-channel'}
    channelId={'abc123'}
    channelType={ChannelType.CHANNEL}
    userProfiles={{}}
    members={undefined}
    memberCount={undefined}
    handleBackButton={() => {
      logger.info('going back')
    }}
  />
))
