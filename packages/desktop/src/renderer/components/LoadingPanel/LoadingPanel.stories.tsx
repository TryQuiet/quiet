import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'
import { withTheme } from '../../storybook/decorators'
import JoiningPanelComponent, { JoiningPanelComponentProps } from './JoiningPanelComponent'
import StartingPanelComponent, { StartingPanelComponentProps } from './StartingPanelComponent'
import { ConnectionProcessInfo } from '@quiet/types'
import { createLogger } from '../../logger'

const logger = createLogger('loadingPanel:stories')

const JoiningPanelTemplate: ComponentStory<typeof JoiningPanelComponent> = args => {
  return <JoiningPanelComponent {...args} />
}
const StartingPanelTemplate: ComponentStory<typeof StartingPanelComponent> = args => {
  return <StartingPanelComponent {...args} />
}

export const JoiningPanel = JoiningPanelTemplate.bind({})
export const StartingPanel = StartingPanelTemplate.bind({})

/** Joining a community reached over Tor: the explanation stays (5978:19161). */
export const JoiningOverTor = JoiningPanelTemplate.bind({})
/** Joining a community on a server: no Tor explanation, no Tor link (1430:48030). */
export const JoiningOnAServer = JoiningPanelTemplate.bind({})
/** Creating one on a server, with the sidebar the frame draws behind it. */
export const CreatingOnAServer = JoiningPanelTemplate.bind({})

const JoiningPanelArgs: JoiningPanelComponentProps = {
  open: true,
  handleClose: function (): void {},
  openUrl: () => logger.info('OpenURL'),
  connectionInfo: { number: 10, text: ConnectionProcessInfo.BACKEND_MODULES },
  isOwner: false,
}
const StartingPanelArgs: StartingPanelComponentProps = {
  open: true,
  handleClose: function (): void {},
}

JoiningPanel.args = JoiningPanelArgs
StartingPanel.args = StartingPanelArgs

JoiningOverTor.args = { ...JoiningPanelArgs, usesServer: false }
JoiningOverTor.parameters = { chromatic: { disableSnapshot: true } }

JoiningOnAServer.args = {
  ...JoiningPanelArgs,
  usesServer: true,
  communityName: 'Rockets',
  connectionInfo: { number: 75, text: ConnectionProcessInfo.CONNECTING_TO_COMMUNITY },
}
JoiningOnAServer.parameters = { chromatic: { disableSnapshot: true } }

CreatingOnAServer.args = {
  ...JoiningPanelArgs,
  usesServer: true,
  isOwner: true,
  communityName: 'Rockets',
  withSidebar: true,
  connectionInfo: { number: 75, text: ConnectionProcessInfo.CONNECTING_TO_COMMUNITY },
}
CreatingOnAServer.parameters = { chromatic: { disableSnapshot: true } }

const component: ComponentMeta<typeof JoiningPanelComponent> = {
  title: 'Components/LoadingPanel',
  decorators: [withTheme],
  component: JoiningPanelComponent,
}

export default component
