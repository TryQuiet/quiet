import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'

import { withTheme } from '../../../storybook/decorators'

import PerformCommunityActionComponent, { PerformCommunityActionProps } from './PerformCommunityActionComponent'
import { CommunityAction } from './community.keys'

const Template: ComponentStory<typeof PerformCommunityActionComponent> = args => {
  return <PerformCommunityActionComponent {...args} />
}

export const Component = Template.bind({})

const args: PerformCommunityActionProps = {
  open: true,
  communityAction: CommunityAction.Create,
  handleCommunityAction: function (): void {
    console.log('Handle community action')
  },
  handleRedirection: function (): void {
    console.log('Redirected to join community')
  },
  initialValue: '',
  handleClose: function (): void { },
  community: true
}

Component.args = args

const component: ComponentMeta<typeof PerformCommunityActionComponent> = {
  title: 'Components/PerformCommunityAction',
  decorators: [withTheme],
  component: PerformCommunityActionComponent
}

export default component
