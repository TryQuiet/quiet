import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'

import { withTheme } from '../../storybook/decorators'
import { ServerAddedComponent, ServerAddedComponentProps } from './ServerAddedComponent'

const Template: ComponentStory<typeof ServerAddedComponent> = args => {
  return <ServerAddedComponent {...args} />
}

export const QuietServer = Template.bind({})
QuietServer.args = {
  open: true,
  onChoose: useServer => {
    // eslint-disable-next-line no-console
    console.info('ServerAdded closed with selection:', useServer)
  },
  serverHosts: [process.env.QSS_ENDPOINT || 'https://quiet.example.com'],
} as ServerAddedComponentProps

export const OtherServer = Template.bind({})
OtherServer.args = {
  open: true,
  onChoose: useServer => {
    // eslint-disable-next-line no-console
    console.info('ServerAdded closed with selection:', useServer)
  },
  serverHosts: ['https://other-server.example.com'],
} as ServerAddedComponentProps

export const MultipleServers = Template.bind({})
MultipleServers.args = {
  open: true,
  onChoose: useServer => {
    // eslint-disable-next-line no-console
    console.info('ServerAdded closed with selection:', useServer)
  },
  serverHosts: ['https://server1.example.com', 'https://server2.example.com'],
} as ServerAddedComponentProps

const component: ComponentMeta<typeof ServerAddedComponent> = {
  title: 'Components/ServerAdded',
  decorators: [withTheme],
  component: ServerAddedComponent,
}

export default component
