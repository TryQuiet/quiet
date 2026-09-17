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
      message={
        'Text from latest chat message. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Id massa venenatis id eget massa commodo posuere faucibus aliquam. At scelerisque nisi mauris facilisis.'
      }
      date={'1:55pm'}
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
      message={
        'Text from latest chat message. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Id massa venenatis id eget massa commodo posuere faucibus aliquam. At scelerisque nisi mauris facilisis.'
      }
      date={'1:55pm'}
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
      message={
        'Text from latest chat message. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Id massa venenatis id eget massa commodo posuere faucibus aliquam. At scelerisque nisi mauris facilisis.'
      }
      date={'1:55pm'}
      unread={true}
      isPublic={false}
      redirect={(id: string) => {
        logger.info(`Clicked ${id}`)
      }}
    />
  ))
  .add('Multi-line message', () => (
    <ChannelTile
      name={'general'}
      id={'general'}
      message={'line one\nline two\n\nline three, which carries on for long enough to need an ellipsis at the end'}
      date={'1:55pm'}
      unread={false}
      isPublic={true}
      redirect={(id: string) => {
        logger.info(`Clicked ${id}`)
      }}
    />
  ))
