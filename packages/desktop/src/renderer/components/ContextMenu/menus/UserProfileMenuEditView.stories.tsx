import React from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'

import { UserProfileMenuEditView } from './UserProfileContextMenu.container'
import { withTheme } from '../../../storybook/decorators'

const Template: ComponentStory<typeof UserProfileMenuEditView> = args => {
  return <UserProfileMenuEditView {...args} />
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
  onSaveUserProfile: () => {},
}

const component: ComponentMeta<typeof UserProfileMenuEditView> = {
  title: 'Components/UserProfileMenuEditView',
  decorators: [withTheme],
  component: UserProfileMenuEditView,
}

export default component
