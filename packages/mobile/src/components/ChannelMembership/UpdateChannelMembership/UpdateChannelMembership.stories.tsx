import { storiesOf } from '@storybook/react-native'
import React from 'react'

import { UpdateChannelMembership } from './UpdateChannelMembership.component'

import { createLogger } from '../../../utils/logger'
import { ChannelType } from '@quiet/types'

const logger = createLogger('channelMembership:stories')

storiesOf('UpdateChannelMembership', module).add('Default', () => (
  <UpdateChannelMembership
    channelTitle={'private-channel'}
    channelName={'private-channel'}
    channelType={ChannelType.CHANNEL}
    channelId={'abc123'}
    nonMembers={{}}
    updateChannelMembership={(memberIds: string[]) => {
      logger.info('updating channel membership')
    }}
    handleBackButton={() => {
      logger.info('going back')
    }}
  />
))
