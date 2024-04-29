import React from 'react'
import { ComponentMeta, ComponentStory } from '@storybook/react'

import { withTheme } from '../../../storybook/decorators'
import WarningModalComponent, { WarningModalComponentProps } from './WarningModal'
import { defaultLogger } from '../../../logger'

const Template: ComponentStory<typeof WarningModalComponent> = args => {
  return <WarningModalComponent {...args} />
}

export const Component = Template.bind({})

const args: WarningModalComponentProps = {
  open: true,
  handleClose: function (): void {
    defaultLogger.info('Closed modal')
  },
  title: 'Warning title',
  subtitle: 'Warning description',
}

Component.args = args

const component: ComponentMeta<typeof WarningModalComponent> = {
  title: 'Components/WarningModal',
  decorators: [withTheme],
  component: WarningModalComponent,
}

export default component
