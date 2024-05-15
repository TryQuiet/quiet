import { storiesOf } from '@storybook/react-native'
import React from 'react'

import { DeleteChannel } from './DeleteChannel.component'

import { createLogger } from '../../utils/logger'

const logger = createLogger('deleteChannel:stories')

storiesOf('DeleteChannel', module).add('Default', () => (
  <DeleteChannel
    name={'general'}
    deleteChannel={() => {
      logger.info('deleting channel')
    }}
    handleBackButton={() => {
      logger.info('going back')
    }}
  />
))
