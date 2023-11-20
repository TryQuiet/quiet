import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'

import UpdateModal, { UpdateModalProps } from './UpdateModal'
import { withTheme } from '../../../storybook/decorators'

const Template: ComponentStory<typeof UpdateModal> = args => {
  return (
    <UpdateModal {...args} />
  )
}

const args: UpdateModalProps = {
    open: true,
    handleClose: function (): void {
        console.log('modal closed')
    },
    handleUpdate: function (): void {
        console.log('updating')
    },
    title: 'Software update',
    message: 'An update is available for Quiet.'
}

export const Component = Template.bind({})

Component.args = args

const component: ComponentMeta<typeof UpdateModal> = {
  title: 'Components/UpdateModalComponent',
  decorators: [withTheme],
  component: UpdateModal,
}

export default component
