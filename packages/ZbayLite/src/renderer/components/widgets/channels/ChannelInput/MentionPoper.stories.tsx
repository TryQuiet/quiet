import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'

import { ChannelInput, IChannelInput } from './ChannelInput'
import { withTheme } from '../../../../storybook/decorators'

import { INPUT_STATE } from '../../../../store/selectors/channel'

const Template: ComponentStory<typeof ChannelInput> = args => {
  return (
    <div style={{ height: '400px', position: 'relative' }}>
      <ChannelInput {...args} />
    </div>
  )
}
export const MentionPoper = Template.bind({})

const args: IChannelInput = {
  infoClass: '',
  setInfoClass: function (_arg: string): void {},
  id: '',
  users: [{ nickname: 'bartek' }, { nickname: 'emilia' }],
  onChange: function (_arg: string): void {},
  onKeyPress: function (_event: any): void {},
  message: '',
  inputState: INPUT_STATE.AVAILABLE,
  inputPlaceholder: ''
}

MentionPoper.args = args

const component: ComponentMeta<typeof ChannelInput> = {
  title: 'Components/ChannelInput',
  decorators: [withTheme],
  component: ChannelInput
}

export default component
