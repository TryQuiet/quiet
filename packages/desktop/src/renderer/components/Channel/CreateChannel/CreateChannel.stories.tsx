import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'

import { withTheme } from '../../../storybook/decorators'
import CreateChannelComponent, { CreateChannelProps } from './CreateChannelComponent'
import { createLogger } from '../../../logger'

const logger = createLogger('createChannel:stories')

const Template: ComponentStory<typeof CreateChannelComponent> = args => {
  return <CreateChannelComponent {...args} />
}

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

/**
 * The panel as a user who may create private channels sees it: the name field, and the private
 * toggle that user is allowed to turn on.
 *
 * The only story here, because every neighbouring state renders the same thing or nothing at all.
 * Toggling private on is done in the panel and the component owns that state, so a "private on"
 * story would be identical to this one. There is no story for a user who may create channels but
 * not private ones: creating channels is a single permission, so that combination is not a state
 * the product will have. Nor one for canCreateChannel: false — the component renders nothing at
 * all then, which is indistinguishable from a broken story, and the unit test covers it instead.
 */
export const PrivateChannelAllowed = Template.bind({})
PrivateChannelAllowed.args = args

const component: ComponentMeta<typeof CreateChannelComponent> = {
  title: 'Private channels/1. Create channel',
  decorators: [withTheme],
  component: CreateChannelComponent,
}

export default component
