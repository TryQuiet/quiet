import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'

import { withTheme } from '../../../storybook/decorators'

import NewMessagesInfoComponent, { NewMessagesInfoComponentProps } from './NewMessagesInfoComponent'

const Template: ComponentStory<typeof NewMessagesInfoComponent> = args => {
    return <NewMessagesInfoComponent {...args} />
}

export const Component = Template.bind({})

const args: NewMessagesInfoComponentProps = {
    scrollBottom: () => {},
    show: true,
}

Component.args = args

const component: ComponentMeta<typeof NewMessagesInfoComponent> = {
    title: 'Components/NewMessagesInfo',
    decorators: [withTheme],
    component: NewMessagesInfoComponent,
}

export default component
