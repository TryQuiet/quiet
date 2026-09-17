import { UserProfile } from '@quiet/types'
import { storiesOf } from '@storybook/react-native'
import React from 'react'

import { UpdateChannelMembership } from './UpdateChannelMembership.component'

import { createLogger } from '../../../utils/logger'

const logger = createLogger('channelMembership:stories')

// Issue #1495: enough members that the list scrolls, so the tap highlight can
// be checked against a drag.
const manyMembers: Record<string, UserProfile> = Object.fromEntries(
  Array.from({ length: 30 }, (_, index) => {
    const userId = `member-${index + 1}`
    return [userId, { userId, nickname: `member-${index + 1}` }]
  })
)

storiesOf('UpdateChannelMembership', module)
  .add('Default', () => (
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
  .add('Many members (scroll to check tap feedback)', () => (
    <UpdateChannelMembership
      channelName={'private-channel'}
      channelId={'abc123'}
      userProfiles={manyMembers}
      updateChannelMembership={(memberIds: string[]) => {
        logger.info('updating channel membership')
      }}
      handleBackButton={() => {
        logger.info('going back')
      }}
    />
  ))
