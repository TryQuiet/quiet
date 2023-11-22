import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'

import MentionElement, { MentionElementProps } from './MentionElement'
import { withTheme } from '../../../../storybook/decorators'

const Template: ComponentStory<typeof MentionElement> = args => {
    return <MentionElement {...args} />
}

export const Component = Template.bind({})

const args: MentionElementProps = {
    name: '',
    channelName: 'general',
    onMouseEnter: function (): void {},
    onClick: function (): void {},
    participant: true,
    highlight: false,
}

Component.args = args

const component: ComponentMeta<typeof MentionElement> = {
    title: 'Components/MentionElement',
    decorators: [withTheme],
    component: MentionElement,
}

export default component
