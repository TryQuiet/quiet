import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'
import { withTheme } from '../../../storybook/decorators'
import AggressiveWarningModalComponent, {
  AggressiveWarningModalComponentProps,
} from './AggressiveWarningModal.component'

const Template: ComponentStory<typeof AggressiveWarningModalComponent> = args => {
  return (
    <div style={{ height: '800px', position: 'relative' }}>
      <AggressiveWarningModalComponent {...args} />
    </div>
  )
}

export const Component = Template.bind({})

const args: AggressiveWarningModalComponentProps = {
  handleClose: function (): void {},
  open: true,
  communityName: 'devteam',
  leaveCommunity: function (): void {},
}

Component.args = args

const component: ComponentMeta<typeof AggressiveWarningModalComponent> = {
  title: 'Components/AggressiveWarningModalComponent',
  decorators: [withTheme],
  component: AggressiveWarningModalComponent,
}

export default component
