import React from 'react'
import { storiesOf } from '@storybook/react-native'

import { ChannelList } from './ChannelList.component'
import { ChannelTileProps } from '../ChannelTile/ChannelTile.types'

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
  .add('Empty', () => (
    <ChannelList
      // @ts-ignore
      community={{
        name: 'Quiet',
      }}
      tiles={[]}
    />
  ))
  // Exercises the search field: type e.g. "des" to narrow the list down, or "zzz" for the empty state.
  .add('Searchable', () => {
    const tiles: ChannelTileProps[] = [
      'general',
      'spam',
      'design',
      'design-review',
      'qa',
      'releases',
      'random',
      'private-chat',
    ].map(name => ({
      name,
      id: name,
      message: 'Text from latest chat message.',
      date: '1:55pm',
      unread: false,
      isPublic: name !== 'private-chat',
      redirect: (id: string) => {
        logger.info(`Clicked ${id}`)
      },
    }))

    return (
      <ChannelList
        // @ts-ignore
        community={{
          name: 'Quiet',
        }}
        tiles={tiles}
        communityContextMenu={null}
      />
    )
  })
