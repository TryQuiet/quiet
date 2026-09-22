import React, { FC, useState } from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'

import { withTheme } from '../../storybook/decorators'

import SettingsComponent, { SettingsComponentProps } from './SettingsComponent'

import { InviteComponent } from './Tabs/Invite/Invite.component'

import { LeaveCommunityComponent } from './Tabs/LeaveCommunity/LeaveCommunityComponent'
import { Typography } from '@mui/material'
import { QRCodeComponent } from './Tabs/QRCode/QRCode.component'
import { composeInvitationShareUrl } from '@quiet/common'
import { InvitationDataVersion } from '@quiet/types'
import type { LinkedDevice } from '@quiet/types'
import { LinkedDevicesComponent } from './Tabs/LinkedDevices/LinkedDevices.component'

const invitationLink = composeInvitationShareUrl({
  version: InvitationDataVersion.v4,
  pairs: [
    {
      peerId: '12D3KooWSZxWV6DmmTNf9sUgcTQqpN3CTuRiJFY4VthXr4yYxXxi',
      onionAddress: 'p3oqdr53dkgg3n5nuezlzyawhxvit5efxzlunvzp7n7lmva6fj3i43ad',
    },
    {
      peerId: '12D3KooWHgLdRMqkepNiYnrur21cyASUNk1f9NZ5tuGa9He8QXNa',
      onionAddress: 'vnywuiyl7p7ig2murcscdyzksko53e4k3dpdm2yoopvvu25p6wwjqbad',
    },
  ],
  psk: '12345',
  authData: {
    teamId: 'abc123',
    communityName: 'foobar',
    seed: 'def456',
  },
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

// Settings is only reachable inside a community, so this tab always has a team
// graph to read devices off: it shows the list. This device and any removed
// device are filtered out before the rows are drawn.
const settingsLinkedDevices: LinkedDevice[] = [
  { deviceId: 'this', deviceName: 'this device', isCurrent: true },
  { deviceId: 'laptop', deviceName: 'nyc-laptop', isCurrent: false },
  { deviceId: 'phone', deviceName: 'work-phone', isCurrent: false },
]

const LinkedDevices: FC = () => {
  const [revealLink, setRevealLink] = useState(false)

  return (
    <LinkedDevicesComponent
      deviceLink={invitationLink}
      isLoading={false}
      revealLink={revealLink}
      onToggleLinkVisibility={() => setRevealLink(currentValue => !currentValue)}
      linkedDevices={settingsLinkedDevices}
    />
  )
}

const args: SettingsComponentProps = {
  open: true,
  handleClose: function (): void {},
  tabs: {
    about: Dummy,
    notifications: Dummy,
    invite: Invite,
    leave: Leave,
    qrcode: QRCode,
    linkedDevices: LinkedDevices,
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

/**
 * The Linked devices tab on its own. Inside Settings the surface is left-aligned
 * (the onboarding modal renders the same component `centered`), so this is where
 * the device list's own geometry is reviewed.
 */
export const LinkedDevicesTab = () => (
  <div style={{ width: 600, padding: 24 }}>
    <LinkedDevices />
  </div>
)

const component: ComponentMeta<typeof SettingsComponent> = {
  title: 'Components/Settings',
  decorators: [withTheme],
  component: SettingsComponent,
}

export default component
