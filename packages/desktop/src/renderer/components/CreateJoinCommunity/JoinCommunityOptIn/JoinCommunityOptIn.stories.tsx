import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'

import { withTheme } from '../../../storybook/decorators'

import { JoinCommunityOptInComponent, JoinCommunityOptInProps } from './JoinCommunityOptIn'
import { createLogger } from '../../../logger'

const logger = createLogger('joinCommunityOptIn:stories')

const Template: ComponentStory<typeof JoinCommunityOptInComponent> = args => {
  return <JoinCommunityOptInComponent {...args} />
}

// Ensure all required props have values
const args: JoinCommunityOptInProps = {
  open: true,
  handleClose: () => {
    logger.info('Closed JoinCommunityOptIn modal')
  },
  handleOptIn: (optedIn: boolean) => {
    logger.info('User opted in:', optedIn)
  },
  openUrl: (url: string) => {
    logger.info('Opening URL:', url)
    // In a story we don't actually open URLs
  },
  isLoading: false,
}

export const Primary = Template.bind({})
Primary.args = args
Primary.storyName = 'Default'

export const LoadingState = Template.bind({})
LoadingState.args = {
  ...args,
  isLoading: true,
}
LoadingState.storyName = 'Loading'

export default {
  title: 'Components/JoinCommunityOptIn',
  decorators: [withTheme],
  component: JoinCommunityOptInComponent,
  parameters: {
    backgrounds: {
      default: 'dark',
    },
  },
} as ComponentMeta<typeof JoinCommunityOptInComponent>
