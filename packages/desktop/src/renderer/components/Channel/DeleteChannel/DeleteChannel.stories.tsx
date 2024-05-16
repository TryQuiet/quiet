import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'

import { withTheme } from '../../../storybook/decorators'
import { useModal } from '../../../containers/hooks'

import DeleteChannelComponent, { DeleteChannelProps } from './DeleteChannelComponent'

import { createLogger } from '../../../logger'

const logger = createLogger('deleteChannel:stories')

const Template: ComponentStory<typeof DeleteChannelComponent> = args => {
  return <DeleteChannelComponent {...args} />
}

export const Component = Template.bind({})

const args: ReturnType<typeof useModal> & DeleteChannelProps = {
  channelName: 'general',
  deleteChannel: () => {
    logger.info('deleting channel')
  },
  open: true,
  // @ts-expect-error
  handleOpen: () => {},
  // @ts-expect-error
  handleClose: () => {},
}

Component.args = args

const component: ComponentMeta<typeof DeleteChannelComponent> = {
  title: 'Components/DeleteChannel',
  decorators: [withTheme],
  component: DeleteChannelComponent,
}

export default component
