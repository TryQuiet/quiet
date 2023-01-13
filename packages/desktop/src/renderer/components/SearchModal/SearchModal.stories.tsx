import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'
import { withTheme } from '../../storybook/decorators'
import SearchModalComponent, { SearchModalComponentProps } from './SearchModelComponent'

const Template: ComponentStory<typeof SearchModalComponent> = args => {
  return <SearchModalComponent {...args} />
}

export const Component = Template.bind({})

const args = {
  open: true,
  publicChannelsSelector: [
    { name: 'fun', address: 'fun' },
    { name: 'mobile', address: 'mobile' },
    { name: 'new-york-plans', address: 'new-york-plans' },
    { name: 'general', address: 'general' }
  ]
}

Component.args = args

const component: ComponentMeta<typeof SearchModalComponent> = {
  title: 'Components/SearchModal',
  decorators: [withTheme],
  component: SearchModalComponent
}

export default component
