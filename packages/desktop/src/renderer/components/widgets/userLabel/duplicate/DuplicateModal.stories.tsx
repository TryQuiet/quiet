import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'
import { withTheme } from '../../../../storybook/decorators'
import DuplicateModalComponent, { DuplicateModalComponentProps } from './DuplicateModal.component'

const Template: ComponentStory<typeof DuplicateModalComponent> = args => {
    return (
        <div style={{ height: '800px', position: 'relative' }}>
            <DuplicateModalComponent {...args} />
        </div>
    )
}

export const Component = Template.bind({})

const args: DuplicateModalComponentProps = {
    handleClose: function (): void {},
    open: true,
}

Component.args = args

const component: ComponentMeta<typeof DuplicateModalComponent> = {
    title: 'Components/UserLabel/DuplicateModalComponent',
    decorators: [withTheme],
    component: DuplicateModalComponent,
}

export default component
