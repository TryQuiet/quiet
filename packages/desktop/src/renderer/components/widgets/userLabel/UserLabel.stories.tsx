import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'
import { withTheme } from '../../../storybook/decorators'
import UserLabel, { UserLabelProps } from './UserLabel.component'
import { payloadDuplicated, payloadUnregistered, UserLabelType } from './UserLabel.types'
import { ModalName } from '../../../sagas/modals/modals.types'
import { modalsActions } from '../../../sagas/modals/modals.slice'

const Template: ComponentStory<typeof UserLabel> = args => {
    return (
        <div style={{ display: 'inline-block' }}>
            <UserLabel {...args} />
        </div>
    )
}

export const Duplicate = Template.bind({})
export const Unregistered = Template.bind({})

const baseArg = {
    duplicatedUsernameModalHandleOpen: () => payloadDuplicated,
    unregisteredUsernameModalHandleOpen: () => payloadUnregistered,
    username: 'johnny',
}

const argsDuplicate: UserLabelProps = {
    ...baseArg,
    type: UserLabelType.DUPLICATE,
}

const argsUnregistered: UserLabelProps = {
    ...baseArg,
    type: UserLabelType.UNREGISTERED,
}

Duplicate.args = argsDuplicate
Unregistered.args = argsUnregistered

const component: ComponentMeta<typeof UserLabel> = {
    title: 'Components/UserLabel',
    decorators: [withTheme],
    component: UserLabel,
}

export default component
