import React, { FC, useState } from 'react'
import { ComponentStory, ComponentMeta } from '@storybook/react'

import { withTheme } from '../../storybook/decorators'

import SettingsComponent, { SettingsComponentProps } from './SettingsComponent'
import { Box } from '../ui'
import PanelHeader, { PANEL_WIDTH } from '../ui/Panel/PanelHeader'

import { InviteComponent } from './Tabs/Invite/Invite.component'

import { LeaveCommunityComponent } from './Tabs/LeaveCommunity/LeaveCommunityComponent'
import { Typography } from '@mui/material'
import { QRCodeComponent } from './Tabs/QRCode/QRCode.component'
import { composeInvitationShareUrl } from '@quiet/common'
import { InvitationDataVersion } from '@quiet/types'
import type { LinkedDevice } from '@quiet/types'
import { LinkDevicesComponent } from '../Onboarding/LinkDevicesComponent'

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

const noop = () => {}

const Leave: FC = () => {
  return <LeaveCommunityComponent communityName={'Rockets'} leaveCommunity={noop} open={false} handleClose={noop} />
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

// Settings is only reachable inside a community, so this tab always shares and always
// has a team graph to read devices from. This device and any removed device are filtered
// out before the rows are drawn.
const settingsLinkedDevices: LinkedDevice[] = [
  { deviceId: 'this', deviceName: 'this device', isCurrent: true },
  { deviceId: 'laptop', deviceName: 'nyc-laptop', isCurrent: false },
  { deviceId: 'phone', deviceName: 'work-phone', isCurrent: false },
]

const LinkedDevices: FC = () => (
  <LinkDevicesComponent
    direction='share'
    onDisplayQrCode={() => {}}
    deviceLink={invitationLink}
    onLinkCopied={() => {}}
    linkedDevices={settingsLinkedDevices}
  />
)

/**
 * One tab in the chrome the drawer puts around it: the bar that titles it, then the tab's own
 * content inset by 16. MUI's Drawer portals out of the story root, so the panels are drawn here
 * without it; everything else is what `SettingsComponent` renders.
 */
const Panel: FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <Box width={PANEL_WIDTH} sx={{ border: '1px solid #E5E5E5' }}>
    <PanelHeader title={title} handleClose={noop} leading={'back'} />
    <Box p={2} width={PANEL_WIDTH}>
      {children}
    </Box>
  </Box>
)

/**
 * The panels side by side, for reading the titles down the row: the bar carries each panel's
 * name and no panel repeats it (Add members 2932:3709 draws the title in the bar and starts the
 * body at the copy), and the QR code is centred on its column as the QR sheet draws it
 * (2932:3707).
 */
export const Panels = () => (
  <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', padding: 24 }}>
    <Panel title='Add Members'>
      <Invite />
    </Panel>
    <Panel title='QR Code'>
      <QRCode />
    </Panel>
    <Panel title='Leave community'>
      <Leave />
    </Panel>
  </div>
)
Panels.storyName = 'Panels — one title each'

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

const component: ComponentMeta<typeof SettingsComponent> = {
  title: 'Components/Settings',
  decorators: [withTheme],
  component: SettingsComponent,
}

export default component
