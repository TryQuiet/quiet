import React from 'react'
import { ComponentMeta } from '@storybook/react'

import Grid from '@mui/material/Grid'
import WindowWrapper from '../ui/WindowWrapper/WindowWrapper'

import { withTheme } from '../../storybook/decorators'

import { Reusable as Sidebar } from '../Sidebar/Sidebar.stories'
import SidebarComponent from '../Sidebar/Sidebar'
import { Component as Channel } from '../Channel/Channel.stories.cy'

const Template = () => {
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
        }}
        wrap='nowrap'>
        <Grid item>
          {/* @ts-ignore */}
          <Sidebar />
        </Grid>
        <Grid item xs>
          {/* @ts-ignore */}
          <Channel {...Channel.args} />
        </Grid>
      </Grid>
    </WindowWrapper>
  )
}

export const Component = Template.bind({})
Component.args = {}
const component: ComponentMeta<typeof SidebarComponent> = {
  title: 'Components/Main',
  decorators: [withTheme],
  component: SidebarComponent
}

export default component
