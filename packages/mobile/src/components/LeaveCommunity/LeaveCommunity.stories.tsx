import { storiesOf } from '@storybook/react-native'
import React from 'react'

import { LeaveCommunity } from './LeaveCommunity.component'

import { createLogger } from '../../utils/logger'

const logger = createLogger('leaveCommunity:stories')

storiesOf('LeaveCommunity', module).add('Default', () => (
  <LeaveCommunity
    name={'Rockets'}
    leaveCommunity={() => {
      logger.info('leaving community')
    }}
    handleBackButton={() => {
      logger.info('going back')
    }}
  />
))
