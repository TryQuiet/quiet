import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'

import { withTheme } from '../../storybook/decorators'

import CreateUsernameComponent, { CreateUsernameComponentProps } from './CreateUsernameComponent'

const Template: ComponentStory<typeof CreateUsernameComponent> = args => {
  return <CreateUsernameComponent {...args} />
}

export const Component = Template.bind({})

const args: CreateUsernameComponentProps = {
  open: true,
  handleClose: function (): void {},
  registerUsername: function (nickname: string): void {
    console.log('Registering username: ', nickname)
  },
}

Component.args = args

const component: ComponentMeta<typeof CreateUsernameComponent> = {
  title: 'Components/CreateUsername',
  decorators: [withTheme],
  component: CreateUsernameComponent,
}

export default component
