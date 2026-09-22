import React, { useState } from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'
import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles'

import WindowWrapper from '../ui/WindowWrapper/WindowWrapper'
import { lightTheme, darkTheme } from '../../theme'

import SidebarComponent, { SidebarComponentProps } from './SidebarComponent'
import { ChannelType, CommunityOwnership } from '@quiet/types'
import { generateDmChannelDisplayName } from '@quiet/common'

const args: SidebarComponentProps = {
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
      id: 'updates',
      name: 'updates',
      description: 'Private channel for updates',
      owner: 'aliceUserId',
      timestamp: Date.now(),
      public: false,
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
  userProfile: {
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
  // The baseline column is clean; `Unread` below is the story that carries badges.
  unreadChannels: [],
  dmChannels: [],
  unreadDms: [],
  setCurrentChannel: function (_id: string): void {},
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
  userId: 'aliceUserId',
  userProfileContextMenu: {
    visible: false,
    handleOpen: function (_args?: any): any {},
    handleClose: function (): any {},
  },
}

const Template: ComponentStory<typeof SidebarComponent> = storyArgs => {
  const [currentChannel, setCurrentChannel] = useState(storyArgs.currentChannelId)

  return (
    <WindowWrapper>
      {/* Fixed to the viewport so the column is flush with the window, as it is
          in the app: Storybook's own body margin would otherwise inset it. */}
      <div style={{ position: 'fixed', inset: 0, display: 'flex', overflow: 'hidden' }}>
        <SidebarComponent {...storyArgs} setCurrentChannel={setCurrentChannel} currentChannelId={currentChannel} />
      </div>
    </WindowWrapper>
  )
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

/** The V1 variant, `6218:16416` - the purple column, and the only one in scope. */
export const Component = Template.bind({})
Component.args = args
Component.storyName = 'V1'

/**
 * Not a designed variant. V1 is purple only ("No dark mode yet", `6222:13638`),
 * so this is just the app's dark theme keeping today's `sidebarBackground`; it
 * is here to catch the column breaking under it, not to review it.
 */
export const UndesignedDarkTheme: ComponentStory<typeof SidebarComponent> = storyArgs => (
  <StyledEngineProvider injectFirst>
    <ThemeProvider theme={darkTheme}>
      <Template {...storyArgs} />
    </ThemeProvider>
  </StyledEngineProvider>
)
UndesignedDarkTheme.args = args
UndesignedDarkTheme.storyName = 'Dark theme (undesigned)'

/** Unread channels carry the library's red badge; Quiet has no unread counts. */
export const Unread = Template.bind({})
Unread.args = { ...args, unreadChannels: ['spooky', 'updates'] }

/** Without the create-channel permission the section header loses its (+). */
export const WithoutCreateChannelPermission = Template.bind({})
WithoutCreateChannelPermission.args = { ...args, canCreateChannel: false }

/**
 * Direct messages of growing size in the real sidebar. Desktop does not shorten a DM title the way
 * mobile does (mobile renders "a, b and N more" via generateTruncatedDmTitle); it renders the full
 * generateDmChannelDisplayName string and lets CSS clip it. The clipping now belongs to the shared
 * `SidebarRow`, whose label is a flex child with `minWidth: 0`, `nowrap` and `text-overflow:
 * ellipsis`, so a long title truncates at the column's 220px rather than at a fixed 150px. This
 * story is here to make that reviewable, including the row that is a conversation with yourself.
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

export const Reusable: ComponentStory<typeof SidebarComponent> = () => <SidebarComponent {...args} />

const component: ComponentMeta<typeof SidebarComponent> = {
  title: 'Components/SidebarComponent',
  decorators: [
    (Story: React.FC) => (
      <StyledEngineProvider injectFirst>
        <ThemeProvider theme={lightTheme}>
          <Story />
        </ThemeProvider>
      </StyledEngineProvider>
    ),
  ],
  component: SidebarComponent,
  excludeStories: ['Reusable'],
}

export default component
