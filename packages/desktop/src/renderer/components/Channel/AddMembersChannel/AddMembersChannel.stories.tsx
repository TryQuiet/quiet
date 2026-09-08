import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'

import { withTheme } from '../../../storybook/decorators'
import { useModal } from '../../../containers/hooks'

import AddMembersChannelComponent, { AddMembersChannelProps } from './AddMembersChannelComponent'

import { createLogger } from '../../../logger'

const logger = createLogger('deleteChannel:stories')

const Template: ComponentStory<typeof AddMembersChannelComponent> = args => {
  return <AddMembersChannelComponent {...args} />
}

export const Component = Template.bind({})

const args: ReturnType<typeof useModal> & AddMembersChannelProps = {
  channelName: 'general',
  channelId: 'foobar',
  allUsers: {},
  possibleMembers: {},
  addMembersToChannel: (memberIds: string[]) => {
    logger.info('adding members')
  },
  open: true,
  // @ts-expect-error
  handleOpen: () => {},
  // @ts-expect-error
  handleClose: () => {},
}

Component.args = args

const component: ComponentMeta<typeof AddMembersChannelComponent> = {
  title: 'Components/DeleteChannel',
  decorators: [withTheme],
  component: AddMembersChannelComponent,
}

export default component
