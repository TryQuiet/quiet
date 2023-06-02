import React, { FC, useState } from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'

import { withTheme } from '../../storybook/decorators'

import SettingsComponent, { SettingsComponentProps } from './SettingsComponent'

import { InviteComponent } from './Tabs/Invite/Invite.component'

import { LeaveCommunityComponent } from './Tabs/LeaveCommunity/LeaveCommunityComponent'
import { Typography } from '@mui/material'
import { QRCodeComponent } from './Tabs/QRCode/QRCode.component'

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

const Invite: FC = () => {
  const [revealInputValue, setRevealInputValue] = useState<boolean>(false)
  return (
    <InviteComponent
      invitationLink={
        'https://tryquiet.org/join#p7lrosb6fvtt7t3fhmuh5uj5twxirpngeipemdm5d32shgz46cbd3bad'
      }
      revealInputValue={revealInputValue}
      handleClickInputReveal={() => {
        setRevealInputValue(!revealInputValue)
      }}
    />
  )
}

const QRCode: FC = () => {
  return (
    <QRCodeComponent value='https://tryquiet.org/join#ytzoaxku26gobduqogx6ydhezgf6aumpcted27qx7tz6z77lzj2zb6ad' />
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
    leave: Leave,
    qrcode: QRCode
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
