import React, { useState } from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'

import Grid from '@mui/material/Grid'
import WindowWrapper from '../ui/WindowWrapper/WindowWrapper'

import { withTheme } from '../../storybook/decorators'

import SidebarComponent from './SidebarComponent'
import { IdentityPanelProps } from './IdentityPanel/IdentityPanel'
import { ChannelsPanelProps } from './ChannelsPanel/ChannelsPanel'

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
          position: 'relative'
        }}>
        <Grid item>
          <SidebarComponent {...args} setCurrentChannel={setCurrentChannel} currentChannelId={currentChannel} />
        </Grid>
      </Grid>
    </WindowWrapper>
  )
}

const args: IdentityPanelProps & ChannelsPanelProps = {
  // @ts-expect-error
  currentCommunity: {
    name: 'rockets'
  },
  accountSettingsModal: {
    open: false,
    handleOpen: function (_args?: any): any {},
    handleClose: function (): any {}
  },
  channels: [
    // @ts-expect-error
    {
      id: 'general',
      name: 'general'
    },
    // @ts-expect-error
    {
      id: 'spooky',
      name: 'spooky'
    },
    // @ts-expect-error
    {
      id: 'kalkan',
      name: 'kalkan'
    }
  ],
  unreadChannels: ['spooky'],
  setCurrentChannel: function (_id: string): void {},
  currentChannel: 'general',
  currentChannelId: 'general',
  createChannelModal: {
    open: false,
    handleOpen: function (_args?: any): any {},
    handleClose: function (): any {}
  }
}

export const Component = Template.bind({})

Component.args = args

export const Reusable: ComponentStory<typeof SidebarComponent> = () => <SidebarComponent {...args} />

const component: ComponentMeta<typeof SidebarComponent> = {
  title: 'Components/SidebarComponent',
  decorators: [withTheme],
  component: SidebarComponent,
  excludeStories: ['Reusable']
}

export default component
