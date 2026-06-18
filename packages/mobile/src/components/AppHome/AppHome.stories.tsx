import React from 'react'
import { storiesOf } from '@storybook/react-native'

import { AppHome } from './AppHome.component'

import { createLogger } from '../../utils/logger'
import { ChannelType } from '@quiet/types'

const logger = createLogger('appHome:stories')

storiesOf('AppHome', module)
  .add('Default', () => (
    <AppHome
      // @ts-ignore
      community={{
        name: 'Quiet',
      }}
      channelTiles={[
        {
          name: 'general',
          id: 'general',
          unread: false,
          isPublic: true,
          redirect: (id: string) => {
            logger.info(`Clicked ${id}`)
          },
          channelType: ChannelType.CHANNEL,
        },
        {
          name: 'spam',
          id: 'spam',
          unread: false,
          isPublic: true,
          redirect: (id: string) => {
            logger.info(`Clicked ${id}`)
          },
          channelType: ChannelType.CHANNEL,
        },
        {
          name: 'design',
          id: 'design',
          unread: true,
          isPublic: true,
          redirect: (id: string) => {
            logger.info(`Clicked ${id}`)
          },
          channelType: ChannelType.CHANNEL,
        },
        {
          name: 'qa',
          id: 'qa',
          unread: false,
          isPublic: true,
          redirect: (id: string) => {
            logger.info(`Clicked ${id}`)
          },
          channelType: ChannelType.CHANNEL,
        },
        {
          name: 'private-chat',
          id: 'private-chat',
          unread: false,
          isPublic: false,
          redirect: (id: string) => {
            logger.info(`Clicked ${id}`)
          },
          channelType: ChannelType.CHANNEL,
        },
      ]}
    />
  ))
  .add('Empty', () => (
    <AppHome
      // @ts-ignore
      community={{
        name: 'Quiet',
      }}
      channelTiles={[]}
    />
  ))
