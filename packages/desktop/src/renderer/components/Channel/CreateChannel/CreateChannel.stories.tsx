import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'

import { withTheme } from '../../../storybook/decorators'
import CreateChannelComponent, { CreateChannelProps } from './CreateChannelComponent'
import { createLogger } from '../../../logger'

const logger = createLogger('createChannel:stories')

const Template: ComponentStory<typeof CreateChannelComponent> = args => {
  return <CreateChannelComponent {...args} />
}

export const Component = Template.bind({})

const args: CreateChannelProps = {
  open: true,
  createChannel: function (name: string): void {
    logger.info('creating channel: ', name)
  },
  canCreateChannel: true,
  canCreatePrivateChannel: true,
  handleClose: function (): void {},
  clearErrorsDispatch: function (): void {},
}

Component.args = args

/**
 * The private-channel row is what differs across permissions, so the states the component actually
 * branches on each get a story. Toggling private on is done in the panel; the component owns that
 * state, so there is no separate "private on" story that would render identically to this one.
 */
export const PrivateChannelAllowed = Template.bind({})
PrivateChannelAllowed.args = { ...args, canCreatePrivateChannel: true }

export const PrivateChannelNotAllowed = Template.bind({})
PrivateChannelNotAllowed.args = { ...args, canCreatePrivateChannel: false }

// No story for canCreateChannel: false — the component renders nothing at all in that case, which
// is indistinguishable from a broken story. The unit test covers it instead.

const component: ComponentMeta<typeof CreateChannelComponent> = {
  title: 'Components/CreateChannel',
  decorators: [withTheme],
  component: CreateChannelComponent,
}

export default component
