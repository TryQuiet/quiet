import React, { useState } from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'

import Grid from '@mui/material/Grid'
import WindowWrapper from '../ui/WindowWrapper/WindowWrapper'

import { withTheme } from '../../storybook/decorators'

import SidebarComponent from './SidebarComponent'
import { IdentityPanelProps } from './IdentityPanel/IdentityPanel'
import { ChannelsPanelProps } from './ChannelsPanel/ChannelsPanel'
import { TorStatusProps } from './TorStatus'
import { UserProfilePanelProps } from './UserProfilePanel/UserProfilePanel'
import { DirectMessagesPanelProps } from './DirectMessagesPanel/DirectMessagesPanel'
import { ChannelType, CommunityOwnership } from '@quiet/types'
import { generateDmChannelDisplayName } from '@quiet/common'

const Template: ComponentStory<typeof SidebarComponent> = args => {
  const [currentChannel, setCurrentChannel] = useState('general')

  return (
    <WindowWrapper>
      <Grid
        container
        direction='row'
        style={{
          minHeight: '100vh',
          minWidth: '100vw',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <Grid item>
          <SidebarComponent {...args} setCurrentChannel={setCurrentChannel} currentChannelId={currentChannel} />
        </Grid>
      </Grid>
    </WindowWrapper>
  )
}

const args: IdentityPanelProps &
  ChannelsPanelProps &
  TorStatusProps &
  UserProfilePanelProps &
  DirectMessagesPanelProps = {
  currentCommunity: {
    name: 'rockets',
    id: 'rocketsCommunityId',
    ownership: CommunityOwnership.Owner,
    teamId: 'foobar',
  },
  accountSettingsModal: {
    open: false,
    handleOpen: function (_args?: any): any {},
    handleClose: function (): any {},
  },
  channels: [
    {
      id: 'general',
      name: 'general',
      description: 'General discussion channel',
      owner: 'aliceUserId',
      timestamp: Date.now(),
      public: true,
      type: ChannelType.CHANNEL,
      teamId: 'foobar',
    },
    {
      id: 'spooky',
      name: 'spooky',
      description: 'Spooky channel for Halloween discussions',
      owner: 'bobUserId',
      timestamp: Date.now(),
      public: true,
      type: ChannelType.CHANNEL,
      teamId: 'foobar',
    },
    {
      id: 'kalkan',
      name: 'kalkan',
      description: 'Kalkan channel for discussions about Kalkan',
      owner: 'charlieUserId',
      timestamp: Date.now(),
      public: true,
      type: ChannelType.CHANNEL,
      teamId: 'foobar',
    },
  ],
  myUserProfile: {
    userId: 'aliceUserId',
    nickname: 'Alice',
    channels: [],
  },
  userProfiles: {
    aliceUserId: {
      userId: 'aliceUserId',
      nickname: 'Alice',
      channels: [],
    },
    bobUserId: {
      userId: 'bobUserId',
      nickname: 'Bob',
      channels: [],
    },
    charlieUserId: {
      userId: 'charlieUserId',
      nickname: 'Charlie',
      channels: [],
    },
  },
  // Presence now answers by user id, so a story says who is online instead of listing peer ids.
  isUserConnected: (userId: string | undefined) => userId === 'aliceUserId' || userId === 'bobUserId',
  unreadChannels: ['spooky'],
  setCurrentChannel: function (_id: string): void {},
  currentChannel: 'general',
  currentChannelId: 'general',
  createChannelModal: {
    open: false,
    handleOpen: function (_args?: any): any {},
    handleClose: function (): any {},
  },
  isTorInitialized: true,
  canCreateChannel: true,
  openNewMessageWindow: function (): void {},
  // @ts-expect-error
  currentIdentity: {},
  userProfileContextMenu: {
    visible: false,
    handleOpen: function (_args?: any): any {},
    handleClose: function (): any {},
  },
}

// Extra members so a DM title can be exercised well past the sidebar's width.
const EXTRA_DM_NAMES = [
  'Denise',
  'Gordon',
  'Annabelle',
  'Christopher',
  'Bartholomew',
  'Evangelina',
  'Maximilian',
  'Seraphina',
  'Nathaniel',
  'Persephone',
]

const dmUserProfiles = { ...args.userProfiles }
EXTRA_DM_NAMES.forEach(nickname => {
  dmUserProfiles[`${nickname}UserId`] = {
    userId: `${nickname}UserId`,
    nickname,
    channels: [],
  }
})

const dmMemberIds = ['aliceUserId', 'bobUserId', ...EXTRA_DM_NAMES.map(name => `${name}UserId`)]

const dmChannelWith = (count: number) => {
  const memberIds = dmMemberIds.slice(0, count)
  return {
    id: `dm_${count}`,
    name: 'Direct message',
    description: 'Direct message',
    owner: 'aliceUserId',
    timestamp: 0,
    public: false,
    teamId: 'foobar',
    type: ChannelType.DM,
    memberIds,
    displayedName: generateDmChannelDisplayName(memberIds, dmUserProfiles, args.myUserProfile),
    messages: { ids: [], entities: {} },
  }
}

/**
 * Direct messages of growing size in the real sidebar. Desktop does not shorten a DM title the way
 * mobile does (mobile renders "a, b and N more" via generateTruncatedDmTitle); it renders the full
 * generateDmChannelDisplayName string and lets CSS clip it — DirectMessageListItem styles .nickname
 * with maxWidth 150, nowrap and text-overflow: ellipsis. This story is here to make that reviewable.
 */
export const DirectMessages = Template.bind({})
DirectMessages.args = {
  ...args,
  userProfiles: dmUserProfiles,
  dmChannels: [1, 2, 3, 5, 12].map(dmChannelWith),
  unreadDms: ['dm_3'],
}

/**
 * The side nav transcribed from the private-channel designs ("Nav bar" in Figma
 * PVQ1Kjf6Cq8ng1czuVtvR8, 838:9760): the same channel set, with private channels marked by a
 * padlock instead of a #, an unread badge, and both section headers carrying the + that opens
 * channel creation and new-message composition.
 *
 * Threads and Drafts appear in the design above Channels; neither feature exists yet, so they are
 * absent here rather than faked.
 */
const designChannel = (name: string, isPublic: boolean) => ({
  id: name,
  name,
  description: `${name} channel`,
  owner: 'aliceUserId',
  timestamp: Date.now(),
  public: isPublic,
  type: ChannelType.CHANNEL,
  teamId: 'foobar',
})

export const DesignReference = Template.bind({})
DesignReference.args = {
  ...args,
  userProfiles: dmUserProfiles,
  channels: [
    designChannel('general', true),
    designChannel('updates', false),
    designChannel('onboarding', true),
    designChannel('fundraising-and-events', false),
    designChannel('files', true),
    designChannel('channel-3', true),
  ],
  unreadChannels: ['onboarding'],
  currentChannelId: 'general',
  canCreateChannel: true,
  dmChannels: [2, 3].map(dmChannelWith),
  unreadDms: [],
  openNewMessageWindow: () => {},
}

export const Component = Template.bind({})

Component.args = args

export const Reusable: ComponentStory<typeof SidebarComponent> = () => <SidebarComponent {...args} />

const component: ComponentMeta<typeof SidebarComponent> = {
  title: 'Components/SidebarComponent',
  decorators: [withTheme],
  component: SidebarComponent,
  excludeStories: ['Reusable'],
}

export default component
