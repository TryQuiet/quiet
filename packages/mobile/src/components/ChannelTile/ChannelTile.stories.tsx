import React from 'react'
import { storiesOf } from '@storybook/react-native'

import { ChannelTile } from './ChannelTile.component'

import { createLogger } from '../../utils/logger'

const logger = createLogger('channelTile:stories')

storiesOf('ChannelTile', module)
  .add('Default', () => (
    <ChannelTile
      name={'general'}
      id={'general'}
      unread={false}
      isPublic={true}
      redirect={(id: string) => {
        logger.info(`Clicked ${id}`)
      }}
    />
  ))
  .add('Unread', () => (
    <ChannelTile
      name={'general'}
      id={'general'}
      unread={true}
      isPublic={true}
      redirect={(id: string) => {
        logger.info(`Clicked ${id}`)
      }}
    />
  ))
  .add('Private', () => (
    <ChannelTile
      name={'private'}
      id={'private'}
      unread={true}
      isPublic={false}
      redirect={(id: string) => {
        logger.info(`Clicked ${id}`)
      }}
    />
  ))
