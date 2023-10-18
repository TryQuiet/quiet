import React, { FC, useState } from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'

import { withTheme } from '../../storybook/decorators'

import SettingsComponent, { SettingsComponentProps } from './SettingsComponent'

import { InviteComponent } from './Tabs/Invite/Invite.component'

import { LeaveCommunityComponent } from './Tabs/LeaveCommunity/LeaveCommunityComponent'
import { Typography } from '@mui/material'
import { QRCodeComponent } from './Tabs/QRCode/QRCode.component'
import { composeToInvitationShareUrl } from '@quiet/common'

const invitationLink = composeToInvitationShareUrl({
  pairs: [
    {
      peerId: 'QmVTkUad2Gq3MkCa8gf12R1gsWDfk2yiTEqb6YGXDG2iQ3',
      onionAddress: 'p3oqdr53dkgg3n5nuezlzyawhxvit5efxzlunvzp7n7lmva6fj3i43ad',
    },
    {
      peerId: 'Qmd2Un9AynokZrcZGsMuaqgupTtidHGQnUkNVfFFAef97C',
      onionAddress: 'vnywuiyl7p7ig2murcscdyzksko53e4k3dpdm2yoopvvu25p6wwjqbad',
    },
  ],
  psk: '12345',
})

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
      invitationLink={invitationLink}
      revealInputValue={revealInputValue}
      handleClickInputReveal={() => {
        setRevealInputValue(!revealInputValue)
      }}
    />
  )
}

const QRCode: FC = () => {
  return <QRCodeComponent value={invitationLink} />
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
    qrcode: QRCode,
  },
  leaveCommunityModal: {
    open: false,
    handleOpen: function (_args?: any): any {},
    handleClose: function (): any {},
  },
}

Component.args = args
WindowsComponent.args = {
  ...args,
  isWindows: true,
}

const component: ComponentMeta<typeof SettingsComponent> = {
  title: 'Components/Settings',
  decorators: [withTheme],
  component: SettingsComponent,
}

export default component
