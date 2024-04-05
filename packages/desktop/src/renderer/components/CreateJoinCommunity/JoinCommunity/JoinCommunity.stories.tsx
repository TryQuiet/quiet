import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'

import { withTheme } from '../../../storybook/decorators'

import PerformCommunityActionComponent, { PerformCommunityActionProps } from '../PerformCommunityActionComponent'
import { CommunityOwnership } from '@quiet/types'

const Template: ComponentStory<typeof PerformCommunityActionComponent> = args => {
  return <PerformCommunityActionComponent {...args} />
}

export const Component = Template.bind({})
export const ServerError = Template.bind({})

const args: PerformCommunityActionProps = {
  open: true,
  communityOwnership: CommunityOwnership.User,
  handleCommunityAction: function (value: string): void {
    console.log('Joining community: ', value)
  },
  handleRedirection: function (): void {
    console.log('Redirected to create community')
  },
  handleClose: function (): void {},
  isCloseDisabled: false,
  hasReceivedResponse: false,
  handleClickInputReveal: function (): void {},
  revealInputValue: false,
}

const serverErrorArgs: PerformCommunityActionProps = {
  ...args,
  serverErrorMessage: 'Could not connect to the server',
  clearServerError: function (): void {
    console.log('Clearing server error message')
  },
}

Component.args = args
ServerError.args = serverErrorArgs

const component: ComponentMeta<typeof PerformCommunityActionComponent> = {
  title: 'Components/JoinCommunity',
  decorators: [withTheme],
  component: PerformCommunityActionComponent,
}

export default component
