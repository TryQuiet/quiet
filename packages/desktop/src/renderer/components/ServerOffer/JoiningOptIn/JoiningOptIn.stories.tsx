import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'

import { withTheme } from '../../../storybook/decorators'

import { JoiningOptInComponent, JoiningOptInComponentProps } from './JoiningOptIn.component'

const Template: ComponentStory<typeof JoiningOptInComponent> = args => {
  return <JoiningOptInComponent {...args} />
}

export const Component = Template.bind({})

const args: JoiningOptInComponentProps = {
  open: true,
  onChoose: (useServer: boolean) => {
    // eslint-disable-next-line no-console
    console.log('User choice:', useServer ? 'Use server' : 'Do not use server')
  },
  qssEndPoint: 'qss.tryquiet.org',
}

Component.args = args

const component: ComponentMeta<typeof JoiningOptInComponent> = {
  title: 'Components/JoiningOptIn',
  decorators: [withTheme],
  component: JoiningOptInComponent,
}

export default component
