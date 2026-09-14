import React, { useState } from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'
import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles'

import WindowWrapper from '../ui/WindowWrapper/WindowWrapper'
import { lightTheme, darkTheme } from '../../theme'

import SidebarComponent, { SidebarComponentProps } from './SidebarComponent'
import { CommunityOwnership } from '@quiet/types'

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
      teamId: 'foobar',
    },
    {
      id: 'updates',
      name: 'updates',
      description: 'Private channel for updates',
      owner: 'aliceUserId',
      timestamp: Date.now(),
      public: false,
      teamId: 'foobar',
    },
    {
      id: 'spooky',
      name: 'spooky',
      description: 'Spooky channel for Halloween discussions',
      owner: 'bobUserId',
      timestamp: Date.now(),
      public: true,
      teamId: 'foobar',
    },
    {
      id: 'kalkan',
      name: 'kalkan',
      description: 'Kalkan channel for discussions about Kalkan',
      owner: 'charlieUserId',
      timestamp: Date.now(),
      public: true,
      teamId: 'foobar',
    },
  ],
  myUserProfile: {
    userId: 'aliceUserId',
    nickname: 'Alice',
    userData: {
      peerId: 'alicePeerId',
      onionAddress: 'alice.onion',
    },
    channels: [],
  },
  userProfile: {
    userId: 'aliceUserId',
    nickname: 'Alice',
    userData: {
      peerId: 'alicePeerId',
      onionAddress: 'alice.onion',
    },
    channels: [],
  },
  userProfiles: {
    aliceUserId: {
      userId: 'aliceUserId',
      nickname: 'Alice',
      userData: {
        peerId: 'alicePeerId',
        onionAddress: 'alice.onion',
      },
      channels: [],
    },
    bobUserId: {
      userId: 'bobUserId',
      nickname: 'Bob',
      userData: {
        peerId: 'bobPeerId',
        onionAddress: 'bob.onion',
      },
      channels: [],
    },
    charlieUserId: {
      userId: 'charlieUserId',
      nickname: 'Charlie',
      userData: {
        peerId: 'charliePeerId',
        onionAddress: 'charlie.onion',
      },
      channels: [],
    },
  },
  connectedPeers: ['alicePeerId', 'bobPeerId'],
  unreadChannels: [],
  setCurrentChannel: function (_id: string): void {},
  currentChannelId: 'general',
  createChannelModal: {
    open: false,
    handleOpen: function (_args?: any): any {},
    handleClose: function (): any {},
  },
  isTorInitialized: true,
  canCreateChannel: true,
  // @ts-expect-error
  currentIdentity: {},
  userId: 'aliceUserId',
  userProfileContextMenu: {
    visible: false,
    handleOpen: function (_args?: any): any {},
    handleClose: function (): any {},
  },
  openSearchModal: function (): void {},
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

/** The library's Mode=Light variant (`5439:58760`) - the app's default theme. */
export const Component = Template.bind({})
Component.args = args
Component.storyName = 'Light'

/** The library's Mode=Dark variant (`5439:58627`). */
export const Dark: ComponentStory<typeof SidebarComponent> = storyArgs => (
  <StyledEngineProvider injectFirst>
    <ThemeProvider theme={darkTheme}>
      <Template {...storyArgs} />
    </ThemeProvider>
  </StyledEngineProvider>
)
Dark.args = args

/** Unread channels carry the library's red badge; Quiet has no unread counts. */
export const Unread = Template.bind({})
Unread.args = { ...args, unreadChannels: ['spooky', 'updates'] }

/** Without the create-channel permission the section header loses its (+). */
export const WithoutCreateChannelPermission = Template.bind({})
WithoutCreateChannelPermission.args = { ...args, canCreateChannel: false }

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
