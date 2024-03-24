import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'

import { withTheme } from '../../../storybook/decorators'

import PerformCommunityActionComponent, { PerformCommunityActionProps } from '../PerformCommunityActionComponent'
import { CommunityOwnership } from '@quiet/types'
import { defaultLogger } from '../../../logger'

const Template: ComponentStory<typeof PerformCommunityActionComponent> = args => {
  return <PerformCommunityActionComponent {...args} />
}

export const Component = Template.bind({})

const args: PerformCommunityActionProps = {
  open: true,
  communityOwnership: CommunityOwnership.Owner,
  handleCommunityAction: function (value: string): void {
    defaultLogger.info('Creating community: ', value)
  },
  handleRedirection: function (): void {
    defaultLogger.info('Redirected to join community')
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
