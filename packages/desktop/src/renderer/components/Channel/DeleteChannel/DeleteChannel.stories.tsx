import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'

import { withTheme } from '../../../storybook/decorators'
import { useModal } from '../../../containers/hooks'

import DeleteChannelComponent, { DeleteChannelProps } from './DeleteChannelComponent'

const Template: ComponentStory<typeof DeleteChannelComponent> = args => {
  return <DeleteChannelComponent {...args} />
}

export const Component = Template.bind({})

const args: ReturnType<typeof useModal> & DeleteChannelProps = {
  channelName: 'general',
  deleteChannel: () => {
    console.log('deleting channel')
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
