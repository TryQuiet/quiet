import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'

import { ChannelInputComponent, ChannelInputProps } from './ChannelInput'
import { withTheme } from '../../../../storybook/decorators'

const Template: ComponentStory<typeof ChannelInputComponent> = args => {
  return (
    <div style={{ height: '400px', position: 'relative' }}>
      <ChannelInputComponent {...args} />
    </div>
  )
}

export const Component = Template.bind({})

const args: ChannelInputProps = {
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

const component: ComponentMeta<typeof ChannelInputComponent> = {
  title: 'Components/ChannelInput',
  decorators: [withTheme],
  component: ChannelInputComponent
}

export default component
