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
  dynamicSearchedChannelsSelector: [
    { name: 'fun', id: 'fun' },
    { name: 'mobile', id: 'mobile' },
    { name: 'new-york-plans', id: 'new-york-plans' }
  ],
  publicChannelsSelector: [
    { name: 'fun', id: 'fun' },
    { name: 'mobile', id: 'mobile' },
    { name: 'new-york-plans', id: 'new-york-plans' },
    { name: 'general', id: 'general' }
  ],
  unreadChannelsSelector: [],
  channelInput: ''
}

Component.args = args

const component: ComponentMeta<typeof SearchModalComponent> = {
  title: 'Components/SearchModal',
  decorators: [withTheme],
  component: SearchModalComponent
}

export default component
