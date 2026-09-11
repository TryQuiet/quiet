import React from 'react'
import { storiesOf } from '@storybook/react-native'

import { ChannelList } from './ChannelList.component'

import { createLogger } from '../../utils/logger'

const logger = createLogger('channelList:stories')

storiesOf('ChannelList', module)
  .add('Default', () => (
    <ChannelList
      // @ts-ignore
      community={{
        name: 'Quiet',
      }}
      tiles={[
        {
          name: 'general',
          id: 'general',
          message:
            'Text from latest chat message. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Id massa venenatis id eget massa commodo posuere faucibus aliquam. At scelerisque nisi mauris facilisis.',
          date: '1:55pm',
          unread: false,
          isPublic: true,
          redirect: (id: string) => {
            logger.info(`Clicked ${id}`)
          },
        },
        {
          name: 'spam',
          id: 'spam',
          message:
            'Text from latest chat message. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Id massa venenatis id eget massa commodo posuere faucibus aliquam. At scelerisque nisi mauris facilisis.',
          date: '1:55pm',
          unread: false,
          isPublic: true,
          redirect: (id: string) => {
            logger.info(`Clicked ${id}`)
          },
        },
        {
          name: 'design',
          id: 'design',
          message:
            'Text from latest chat message. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Id massa venenatis id eget massa commodo posuere faucibus aliquam. At scelerisque nisi mauris facilisis.',
          date: '6/1/22',
          unread: true,
          isPublic: true,
          redirect: (id: string) => {
            logger.info(`Clicked ${id}`)
          },
        },
        {
          name: 'qa',
          id: 'qa',
          message:
            'Text from latest chat message. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Id massa venenatis id eget massa commodo posuere faucibus aliquam. At scelerisque nisi mauris facilisis.',
          date: 'Yesterday',
          unread: false,
          isPublic: true,
          redirect: (id: string) => {
            logger.info(`Clicked ${id}`)
          },
        },
        {
          name: 'private-chat',
          id: 'private-chat',
          message:
            'Text from latest chat message. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Id massa venenatis id eget massa commodo posuere faucibus aliquam. At scelerisque nisi mauris facilisis.',
          date: 'Yesterday',
          unread: false,
          isPublic: false,
          redirect: (id: string) => {
            logger.info(`Clicked ${id}`)
          },
        },
      ]}
    />
  ))
  // Issue #1495: a list long enough to scroll, so the tap highlight can be
  // checked against a drag. Flick through it - no tile should dim - then tap
  // one and the dim should appear and clear with the tap.
  .add('Long list (scroll to check tap feedback)', () => (
    <ChannelList
      // @ts-ignore
      community={{
        name: 'Quiet',
      }}
      tiles={Array.from({ length: 30 }, (_, index) => ({
        name: `channel-${index + 1}`,
        id: `channel-${index + 1}`,
        message: 'Text from latest chat message. Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
        date: '1:55pm',
        unread: index % 4 === 0,
        isPublic: index % 5 !== 0,
        redirect: (id: string) => {
          logger.info(`Clicked ${id}`)
        },
      }))}
    />
  ))
  .add('Empty', () => (
    <ChannelList
      // @ts-ignore
      community={{
        name: 'Quiet',
      }}
      tiles={[]}
    />
  ))
