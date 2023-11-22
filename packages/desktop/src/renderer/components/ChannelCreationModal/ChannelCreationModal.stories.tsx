import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'
import { withTheme } from '../../storybook/decorators'
import ChannelCreationModalComponent, { ChannelCreationModalComponentProps } from './ChannelCreationModal.component'

const ChannelCreationModalTemplate: ComponentStory<typeof ChannelCreationModalComponent> = args => {
    return <ChannelCreationModalComponent {...args} />
}

export const ChannelCreationModal = ChannelCreationModalTemplate.bind({})

const ChannelCreationModalArgs: ChannelCreationModalComponentProps = {
    open: true,
    handleClose: function (): void {},
}

ChannelCreationModal.args = ChannelCreationModalArgs

const component: ComponentMeta<typeof ChannelCreationModalComponent> = {
    title: 'Components/ChannelCreationModal',
    decorators: [withTheme],
    component: ChannelCreationModalComponent,
}

export default component
