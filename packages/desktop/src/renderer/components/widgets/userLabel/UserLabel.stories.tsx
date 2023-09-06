import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'
import { withTheme } from '../../../storybook/decorators'
import UserLabel, { UserLabelProps } from './UserLabel.component'
import { UserLabelType } from './UserLabel.types'

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
  handleOpen: function (): void {},
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
