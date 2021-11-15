import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'

import { ChannelInput, IChannelInput } from './ChannelInput'
import { withTheme } from '../../../../storybook/decorators'

const Template: ComponentStory<typeof ChannelInput> = args => {
  return (
    <div style={{ height: '400px', position: 'relative' }}>
      <ChannelInput {...args} />
    </div>
  )
}

export const Component = Template.bind({})

const args: IChannelInput = {
  channelAddress: 'channelAddress',
  channelParticipants: [{ nickname: 'bartek' }, { nickname: 'emilia' }],
  inputPlaceholder: '#general as @holmes',
  onChange: function (_arg: string): void {},
  onKeyPress: function (input: string): void {
    console.log('send message', input)
  },
  infoClass: '',
  setInfoClass: function (_arg: string): void {}
}

Component.args = args

const component: ComponentMeta<typeof ChannelInput> = {
  title: 'Components/ChannelInput',
  decorators: [withTheme],
  component: ChannelInput
}

export default component
