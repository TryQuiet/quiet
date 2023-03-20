import React, { FC, useState } from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'

import { withTheme } from '../../storybook/decorators'

import SettingsComponent, { SettingsComponentProps } from './SettingsComponent'

// import { About } from '../widgets/Settings/About'

// import { NotificationsComponent } from './Tabs/Notifications/NotificationsComponent'
// import { NotificationsOptions, NotificationsSounds } from '@quiet/state-manager'

import { InviteComponent } from './Tabs/Invite/InviteComponent'

import { LeaveCommunityComponent } from './Tabs/LeaveCommunity/LeaveCommunityComponent'
import { Typography } from '@mui/material'

const Template: ComponentStory<typeof SettingsComponent> = args => {
  return <SettingsComponent {...args} />
}

export const Component = Template.bind({})
export const WindowsComponent = Template.bind({})

const Dummy: FC = () => {
  return <Typography>Dummy</Typography>
}

const Leave: FC = () => {
  return (
    <LeaveCommunityComponent
      communityName={'Rockets'}
      leaveCommunity={jest.fn()}
      open={false}
      handleClose={jest.fn()}
    />
  )
}

// const Notifications: FC = () => {
//   return (
//     <NotificationsComponent
//       notificationsOption={NotificationsOptions.notifyForEveryMessage}
//       notificationsSound={NotificationsSounds.pow}
//       setNotificationsOption={function (_type: NotificationsOptions): void {}}
//       setNotificationsSound={function (_type: NotificationsSounds): void {}}
//     />
//   )
// }

const Invite: FC = () => {
  const [revealInputValue, setRevealInputValue] = useState<boolean>(false)
  return (
    <InviteComponent
      communityName={'Rockets'}
      invitationUrl={'ytzoaxku26gobduqogx6ydhezgf6aumpcted27qx7tz6z77lzj2zb6ad'}
      revealInputValue={revealInputValue}
      handleClickInputReveal={() => {
        setRevealInputValue(!revealInputValue)
      }}
    />
  )
}

const args: SettingsComponentProps = {
  open: true,
  handleClose: function (): void {},
  isOwner: true,
  tabs: {
    about: Dummy,
    notifications: Dummy,
    invite: Invite,
    leave: Leave
  },
  leaveCommunityModal: {
    open: false,
    handleOpen: function (_args?: any): any {},
    handleClose: function (): any {}
  }
}

Component.args = args
WindowsComponent.args = {
  ...args,
  isWindows: true
}

const component: ComponentMeta<typeof SettingsComponent> = {
  title: 'Components/Settings',
  decorators: [withTheme],
  component: SettingsComponent
}

export default component
