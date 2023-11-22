import React from 'react'
import { ComponentMeta, ComponentStory } from '@storybook/react'

import { withTheme } from '../../../storybook/decorators'

import { SentryWarningComponent, SentryWarningProps } from './SentryWarningComponent'

const Template: ComponentStory<typeof SentryWarningComponent> = args => {
    return <SentryWarningComponent {...args} />
}

export const Component = Template.bind({})

const args: SentryWarningProps = {
    open: true,
    handleClose: function (): void {
        console.log('Closed modal')
    },
}

Component.args = args

const component: ComponentMeta<typeof SentryWarningComponent> = {
    title: 'Components/SentryWarning',
    decorators: [withTheme],
    component: SentryWarningComponent,
}

export default component
