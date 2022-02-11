import React, { useState } from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'

import Grid from '@material-ui/core/Grid'
import WindowWrapper from '../ui/WindowWrapper/WindowWrapper'

import { withTheme } from '../../storybook/decorators'

import SidebarComponent from './SidebarComponent'
import { IdentityPanelProps } from './IdentityPanel/IdentityPanel'
import { ChannelsPanelProps } from './ChannelsPanel/ChannelsPanel'

const Template: ComponentStory<typeof SidebarComponent> = args => {
  const [currentChannel, setCurrentChannel] = useState('general')

  args.setCurrentChannel = setCurrentChannel
  args.currentChannel = currentChannel

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
          <SidebarComponent {...args} />
        </Grid>
      </Grid>
    </WindowWrapper>
  )
}

export const Component = Template.bind({})

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
      address: 'general',
      name: 'general'
    },
    // @ts-expect-error
    {
      address: 'spooky',
      name: 'spooky'
    },
    // @ts-expect-error
    {
      address: 'kalkan',
      name: 'kalkan'
    }
  ],
  unreadChannels: ['spooky'],
  setCurrentChannel: function (_address: string): void {},
  currentChannel: '',
  createChannelModal: {
    open: false,
    handleOpen: function (_args?: any): any {},
    handleClose: function (): any {}
  },
  joinChannelModal: {
    open: false,
    handleOpen: function (_args?: any): any {},
    handleClose: function (): any {}
  }
}

Component.args = args

const component: ComponentMeta<typeof SidebarComponent> = {
  title: 'Components/SidebarComponent',
  decorators: [withTheme],
  component: SidebarComponent
}

export default component
