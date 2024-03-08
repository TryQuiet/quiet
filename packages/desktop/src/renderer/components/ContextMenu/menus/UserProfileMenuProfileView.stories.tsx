import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'

import { UserProfileMenuProfileView } from './UserProfileContextMenu.container'
import { withTheme } from '../../../storybook/decorators'

const Template: ComponentStory<typeof UserProfileMenuProfileView> = args => {
  return <UserProfileMenuProfileView {...args} />
}

export const Component = Template.bind({})

Component.args = {
  username: 'nick',
  contextMenu: {
    visible: true,
    handleOpen: () => {},
    handleClose: () => {},
  },
  setRoute: () => {},
}

const component: ComponentMeta<typeof UserProfileMenuProfileView> = {
  title: 'Components/UserProfileMenuProfileView',
  decorators: [withTheme],
  component: UserProfileMenuProfileView,
}

export default component
