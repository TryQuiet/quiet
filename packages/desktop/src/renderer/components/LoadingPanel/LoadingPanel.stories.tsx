import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'
import { withTheme } from '../../storybook/decorators'
import JoiningPanelComponent, { JoiningPanelComponentProps } from './JoiningPanelComponent'
import StartingPanelComponent, { StartingPanelComponentProps } from './StartingPanelComponent'

const JoiningPanelTemplate: ComponentStory<typeof JoiningPanelComponent> = args => {
  return <JoiningPanelComponent {...args} />
}
const StartingPanelTemplate: ComponentStory<typeof StartingPanelComponent> = args => {
  return <StartingPanelComponent {...args} />
}

export const JoiningPanel = JoiningPanelTemplate.bind({})
export const StartingPanel = StartingPanelTemplate.bind({})

const JoiningPanelArgs: JoiningPanelComponentProps = {
  open: true,
  handleClose: function (): void {},
  openUrl: () => console.log('OpenURL'),
  torConnectionInfo: { number: 10, text: 'Fetching' },
  isOwner: false,
}
const StartingPanelArgs: StartingPanelComponentProps = {
  open: true,
  handleClose: function (): void {},
  message: 'Starting Quiet',
  torBootstrapInfo: 'Bootstrapped 100% (done)',
}

JoiningPanel.args = JoiningPanelArgs
StartingPanel.args = StartingPanelArgs

const component: ComponentMeta<typeof JoiningPanelComponent> = {
  title: 'Components/LoadingPanel',
  decorators: [withTheme],
  component: JoiningPanelComponent,
}

export default component
