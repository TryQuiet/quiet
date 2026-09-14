import React from 'react'
import { storiesOf } from '@storybook/react-native'

import { CommunityHome } from './CommunityHome.component'
import { createLogger } from '../../utils/logger'

import type { CommunityHomeChannel, CommunityHomeUser } from './CommunityHome.types'

const logger = createLogger('communityHome:stories')

const channels: CommunityHomeChannel[] = [
  { id: 'general', name: 'general', isPublic: true, unread: false },
  { id: 'bug-reporting', name: 'bug-reporting', isPublic: true, unread: true },
  { id: 'philosophy', name: 'philosophy', isPublic: false, unread: false },
  { id: 'fundraising-and-events', name: 'fundraising-and-events', isPublic: false, unread: false },
  { id: 'files', name: 'files', isPublic: true, unread: false },
]

const users: CommunityHomeUser[] = [
  { userId: 'stone-jump', nickname: 'StoneJump' },
  { userId: 'wave-dance', nickname: 'WaveDanceg2lgb7fjl' },
  { userId: 'moon-thinke', nickname: 'MoonThinke8' },
  { userId: 'leaf-laughu', nickname: 'LeafLaughu0emn9f' },
]

const handlers = {
  openCommunityMenu: () => logger.info('open community menu'),
  addMembers: () => logger.info('add members'),
  createChannel: () => logger.info('create channel'),
  openChannel: (id: string) => logger.info(`open channel ${id}`),
}

storiesOf('CommunityHome', module)
  .add('Default', () => (
    <CommunityHome communityName='nyc-activism' channels={channels} users={users} canCreateChannel {...handlers} />
  ))
  .add('Without create permission', () => (
    <CommunityHome
      communityName='nyc-activism'
      channels={channels}
      users={users}
      canCreateChannel={false}
      {...handlers}
    />
  ))
  .add('No members yet', () => (
    <CommunityHome
      communityName='nyc-activism'
      channels={[{ id: 'general', name: 'general', isPublic: true, unread: false }]}
      users={[]}
      canCreateChannel
      {...handlers}
    />
  ))
  .add('Connecting', () => (
    <CommunityHome communityName='nyc-activism' channels={[]} users={[]} canCreateChannel {...handlers} />
  ))
  .add('Long community name', () => (
    <CommunityHome
      communityName='a-very-long-community-name-that-will-not-fit'
      channels={channels}
      users={users}
      canCreateChannel
      {...handlers}
    />
  ))
