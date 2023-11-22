import React from 'react'
import { ComponentMeta, ComponentStory } from '@storybook/react'

import { withTheme } from '../../../storybook/decorators'
import UpdateModal, { UpdateModalProps } from './UpdateModal'

const Template: ComponentStory<typeof UpdateModal> = args => {
    return <UpdateModal {...args} />
}

export const Component = Template.bind({})

const args: UpdateModalProps = {
    open: true,
    handleClose: function (): void {},
    handleUpdate: function (): void {},
}

Component.args = args

const component: ComponentMeta<typeof UpdateModal> = {
    title: 'Components/UpdateModal',
    decorators: [withTheme],
    component: UpdateModal,
}

export default component
