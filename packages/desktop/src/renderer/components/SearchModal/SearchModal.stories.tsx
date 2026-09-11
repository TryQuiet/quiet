import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'
import { withTheme } from '../../storybook/decorators'
import SearchModalComponent, { SearchModalComponentProps } from './SearchModelComponent'
import { ChannelType } from '@quiet/types'

const Template: ComponentStory<typeof SearchModalComponent> = args => {
  return <SearchModalComponent {...args} />
}

export const Component = Template.bind({})

const args: SearchModalComponentProps = {
  open: true,
  dynamicSearchedChannelsSelector: [
    {
      name: 'fun',
      id: 'fun',
      messages: { ids: [], entities: {} },
      description: '',
      owner: '',
      timestamp: 123123,
      public: true,
      type: ChannelType.CHANNEL,
      displayedName: 'fun',
      teamId: 'foobar',
    },
    {
      name: 'mobile',
      id: 'mobile',
      messages: { ids: [], entities: {} },
      description: '',
      owner: '',
      timestamp: 123123,
      public: true,
      type: ChannelType.CHANNEL,
      displayedName: 'mobile',
      teamId: 'foobar',
    },
    {
      name: 'new-york-plans',
      id: 'new-york-plans',
      messages: { ids: [], entities: {} },
      description: '',
      owner: '',
      timestamp: 123123,
      public: true,
      type: ChannelType.CHANNEL,
      displayedName: 'new-york-plans',
      teamId: 'foobar',
    },
  ],
  publicChannelsSelector: [
    {
      name: 'fun',
      id: 'fun',
      messages: { ids: [], entities: {} },
      description: '',
      owner: '',
      timestamp: 123123,
      public: true,
      type: ChannelType.CHANNEL,
      displayedName: 'fun',
      teamId: 'foobar',
    },
    {
      name: 'mobile',
      id: 'mobile',
      messages: { ids: [], entities: {} },
      description: '',
      owner: '',
      timestamp: 123123,
      public: true,
      type: ChannelType.CHANNEL,
      displayedName: 'mobile',
      teamId: 'foobar',
    },
    {
      name: 'new-york-plans',
      id: 'new-york-plans',
      messages: { ids: [], entities: {} },
      description: '',
      owner: '',
      timestamp: 123123,
      public: true,
      type: ChannelType.CHANNEL,
      displayedName: 'new-york-plans',
      teamId: 'foobar',
    },
    {
      name: 'general',
      id: 'general',
      messages: { ids: [], entities: {} },
      description: '',
      owner: '',
      timestamp: 123123,
      public: true,
      type: ChannelType.CHANNEL,
      displayedName: 'general',
      teamId: 'foobar',
    },
  ],
  unreadChannelsSelector: [],
  channelInput: '',
  handleClose: () => {},
  setCurrentChannel: () => {},
  setChannelInput: () => {},
}

Component.args = args

const component: ComponentMeta<typeof SearchModalComponent> = {
  title: 'Components/SearchModal',
  decorators: [withTheme],
  component: SearchModalComponent,
}

export default component
