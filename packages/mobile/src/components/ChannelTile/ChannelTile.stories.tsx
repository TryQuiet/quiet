import React from 'react'
import { storiesOf } from '@storybook/react-native'

import { ChannelTile } from './ChannelTile.component'

import { createLogger } from '../../utils/logger'
import { ChannelType } from '@quiet/types'

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
      channelType={ChannelType.CHANNEL}
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
      channelType={ChannelType.CHANNEL}
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
      channelType={ChannelType.CHANNEL}
    />
  ))
