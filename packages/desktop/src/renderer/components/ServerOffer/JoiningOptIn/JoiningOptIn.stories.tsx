import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'

import { withTheme } from '../../../storybook/decorators'

import { JoiningOptInComponent, JoiningOptInComponentProps } from './JoiningOptInComponent'

const Template: ComponentStory<typeof JoiningOptInComponent> = args => {
  return <JoiningOptInComponent {...args} />
}

export const Component = Template.bind({})

const args: JoiningOptInComponentProps = {
  open: true,
  handleClose: selection => {
    // eslint-disable-next-line no-console
    console.info('JoiningOptIn closed with selection:', selection)
  },
  showDontShowAgain: true,
}

Component.args = args

const component: ComponentMeta<typeof JoiningOptInComponent> = {
  title: 'Components/JoiningOptIn',
  decorators: [withTheme],
  component: JoiningOptInComponent,
}

export default component
