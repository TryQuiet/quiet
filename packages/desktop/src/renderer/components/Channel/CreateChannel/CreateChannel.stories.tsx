import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'

import { withTheme } from '../../../storybook/decorators'
import CreateChannelComponent, { CreateChannelProps } from './CreateChannelComponent'
import { defaultLogger } from '../../../logger'

const Template: ComponentStory<typeof CreateChannelComponent> = args => {
  return <CreateChannelComponent {...args} />
}

export const Component = Template.bind({})

const args: CreateChannelProps = {
  open: true,
  createChannel: function (name: string): void {
    defaultLogger.info('creating channel: ', name)
  },
  handleClose: function (): void {},
  clearErrorsDispatch: function (): void {},
}

Component.args = args

const component: ComponentMeta<typeof CreateChannelComponent> = {
  title: 'Components/CreateChannel',
  decorators: [withTheme],
  component: CreateChannelComponent,
}

export default component
