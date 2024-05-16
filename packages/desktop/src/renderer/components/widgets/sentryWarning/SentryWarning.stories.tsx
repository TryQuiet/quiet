import React from 'react'
import { ComponentMeta, ComponentStory } from '@storybook/react'

import { withTheme } from '../../../storybook/decorators'

import { SentryWarningComponent, SentryWarningProps } from './SentryWarningComponent'

import { createLogger } from '../../../logger'

const logger = createLogger('sentryWarning:stories')

const Template: ComponentStory<typeof SentryWarningComponent> = args => {
  return <SentryWarningComponent {...args} />
}

export const Component = Template.bind({})

const args: SentryWarningProps = {
  open: true,
  handleClose: function (): void {
    logger.info('Closed modal')
  },
}

Component.args = args

const component: ComponentMeta<typeof SentryWarningComponent> = {
  title: 'Components/SentryWarning',
  decorators: [withTheme],
  component: SentryWarningComponent,
}

export default component
