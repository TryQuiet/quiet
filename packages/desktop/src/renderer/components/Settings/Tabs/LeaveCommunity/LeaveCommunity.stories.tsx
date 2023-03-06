import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'

import { withTheme } from '../../../../storybook/decorators'

import { LeaveCommunityComponent, LeaveCommunityProps } from './LeaveCommunityComponent'

const Template: ComponentStory<typeof LeaveCommunityComponent> = args => {
  return <LeaveCommunityComponent {...args} />
}

export const Component = Template.bind({})

const args: LeaveCommunityProps = {
  communityName: 'Rockets',
  leaveCommunity: function (): void {}
}

Component.args = args

export const component: ComponentMeta<typeof LeaveCommunityComponent> = {
  title: 'Components/LeaveCommunity',
  decorators: [withTheme],
  component: LeaveCommunityComponent
}

export default component
