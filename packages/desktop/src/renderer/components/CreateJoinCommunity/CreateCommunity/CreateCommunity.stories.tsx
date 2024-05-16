import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'

import { withTheme } from '../../../storybook/decorators'

import PerformCommunityActionComponent, { PerformCommunityActionProps } from '../PerformCommunityActionComponent'
import { CommunityOwnership } from '@quiet/types'

import { createLogger } from '../../../logger'

const logger = createLogger('createCommunity:stories')

const Template: ComponentStory<typeof PerformCommunityActionComponent> = args => {
  return <PerformCommunityActionComponent {...args} />
}

export const Component = Template.bind({})

const args: PerformCommunityActionProps = {
  open: true,
  communityOwnership: CommunityOwnership.Owner,
  handleCommunityAction: function (value: string): void {
    logger.info('Creating community: ', value)
  },
  handleRedirection: function (): void {
    logger.info('Redirected to join community')
  },
  handleClose: function (): void {},
  isCloseDisabled: false,
  hasReceivedResponse: false,
}

Component.args = args

const component: ComponentMeta<typeof PerformCommunityActionComponent> = {
  title: 'Components/CreateCommunity',
  decorators: [withTheme],
  component: PerformCommunityActionComponent,
}

export default component
