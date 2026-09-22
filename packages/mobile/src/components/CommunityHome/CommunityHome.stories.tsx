import React from 'react'
import { storiesOf } from '@storybook/react-native'

import { ChannelType, type PublicChannelStorage } from '@quiet/types'

import { CommunityHome } from './CommunityHome.component'
import { createLogger } from '../../utils/logger'

import type { CommunityHomeChannel, CommunityHomeConversation } from './CommunityHome.types'

const logger = createLogger('communityHome:stories')

const channels: CommunityHomeChannel[] = [
  { id: 'general', name: 'general', isPublic: true, unread: false },
  { id: 'bug-reporting', name: 'bug-reporting', isPublic: true, unread: true },
  { id: 'philosophy', name: 'philosophy', isPublic: false, unread: false },
  { id: 'fundraising-and-events', name: 'fundraising-and-events', isPublic: false, unread: false },
  { id: 'files', name: 'files', isPublic: true, unread: false },
]

const dmChannel = (id: string, name: string): PublicChannelStorage =>
  ({
    id,
    name,
    displayedName: name,
    type: ChannelType.DM,
    owner: 'owner',
    description: '',
    timestamp: 0,
    memberIds: ['me', id],
  }) as unknown as PublicChannelStorage

/** A conversation row: the person, their presence and whether it is unread. */
const conversation = (
  id: string,
  nickname: string,
  { connected, unread = false }: { connected?: boolean; unread?: boolean } = {}
): CommunityHomeConversation => ({
  id,
  name: nickname,
  unread,
  channel: dmChannel(id, nickname),
  userData: { connected, user: { userId: id, nickname } as never },
})

const conversations: CommunityHomeConversation[] = [
  conversation('stone-jump', 'StoneJump', { connected: true }),
  conversation('wave-dance', 'WaveDanceg2lgb7fjl', { connected: false, unread: true }),
  conversation('moon-thinke', 'MoonThinke8', { connected: true }),
  conversation('leaf-laughu', 'LeafLaughu0emn9f'),
]

const handlers = {
  openCommunityMenu: () => logger.info('open community menu'),
  addMembers: () => logger.info('add members'),
  createChannel: () => logger.info('create channel'),
  createDm: () => logger.info('new direct message'),
  openChannel: (id: string) => logger.info(`open channel ${id}`),
}

storiesOf('CommunityHome', module)
  .add('Default', () => (
    <CommunityHome
      communityName='nyc-activism'
      channels={channels}
      conversations={conversations}
      canCreateChannel
      {...handlers}
    />
  ))
  .add('Without create permission', () => (
    <CommunityHome
      communityName='nyc-activism'
      channels={channels}
      conversations={conversations}
      canCreateChannel={false}
      {...handlers}
    />
  ))
  .add('No conversations yet', () => (
    <CommunityHome
      communityName='nyc-activism'
      channels={[{ id: 'general', name: 'general', isPublic: true, unread: false }]}
      conversations={[]}
      canCreateChannel
      {...handlers}
    />
  ))
  .add('Connecting', () => (
    <CommunityHome communityName='nyc-activism' channels={[]} conversations={[]} canCreateChannel {...handlers} />
  ))
  .add('Long community name', () => (
    <CommunityHome
      communityName='a-very-long-community-name-that-will-not-fit'
      channels={channels}
      conversations={conversations}
      canCreateChannel
      {...handlers}
    />
  ))
