import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'
import BasicMessageComponent, { BasicMessageProps } from './BasicMessage'
import { FileActionsProps } from '../../Channel/File/FileComponent/FileComponent'
import { DisplayableMessage } from '@quiet/types'
import { withTheme } from '../../../storybook/decorators'
import { UserLabelType } from './UserLabel'

const Template: ComponentStory<typeof BasicMessageComponent> = args => {
  return (
    <div style={{ height: '400px', position: 'relative' }}>
      <BasicMessageComponent {...args} />
    </div>
  )
}

export const Component = Template.bind({})
export const Duplicate = Template.bind({})
export const Unregistered = Template.bind({})

const _message: DisplayableMessage = {
  id: '32',
  type: 1,
  media: undefined,
  message: 'test',
  createdAt: 0,
  date: '12:46',
  nickname: 'vader',
}

const args: BasicMessageProps & FileActionsProps = {
  messages: [_message],
  openUrl: function (url: string): void {},
}

const argsDuplicate: BasicMessageProps & FileActionsProps = {
  ...args,
  userLabel: UserLabelType.DUPLICATE,
}

const argsUnregistered: BasicMessageProps & FileActionsProps = {
  ...args,
  userLabel: UserLabelType.UNREGISTERED,
}

Component.args = args
Duplicate.args = argsDuplicate
Unregistered.args = argsUnregistered

const component: ComponentMeta<typeof BasicMessageComponent> = {
  title: 'Components/BasicMessage',
  decorators: [withTheme],
  component: BasicMessageComponent,
}

export default component
