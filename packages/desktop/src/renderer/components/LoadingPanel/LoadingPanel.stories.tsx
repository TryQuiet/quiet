import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'
import { withTheme } from '../../storybook/decorators'
import LoadingPanelComponent, { LoadingPanelComponentProps } from './LoadingPanelComponent'

const Template: ComponentStory<typeof LoadingPanelComponent> = args => {
  return <LoadingPanelComponent {...args} />
}

export const Component = Template.bind({})

const args: LoadingPanelComponentProps = {
  open: true,
  handleClose: function (): void {},
  message: 'test message'
}

Component.args = args

const component: ComponentMeta<typeof LoadingPanelComponent> = {
  title: 'Components/LoadingPanel',
  decorators: [withTheme],
  component: LoadingPanelComponent
}

export default component
