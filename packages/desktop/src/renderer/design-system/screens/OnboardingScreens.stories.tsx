import React from 'react'
import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles'

import { lightTheme } from '../../theme'
import { INK_3, mono, RULE } from '../specimen/ui'

import { GetStartedComponent } from '../../components/Onboarding/GetStartedComponent'
import { JoinCommunityOptionsComponent } from '../../components/Onboarding/JoinCommunityOptionsComponent'
import { OpenInviteLinkComponent } from '../../components/Onboarding/OpenInviteLinkComponent'
import { PasteLinkComponent } from '../../components/Onboarding/PasteLinkComponent'
import { CreateCommunityComponent } from '../../components/Onboarding/CreateCommunityComponent'
import { LinkDevicesComponent } from '../../components/Onboarding/LinkDevicesComponent'
import { LinkedDevicesComponent } from '../../components/Settings/Tabs/LinkedDevices/LinkedDevices.component'

// The implemented onboarding screens, one story each, rendered as the 600px
// desktop modal body and again at the prototype's 375px width. Both columns are
// the DESKTOP component: the React Native screens (packages/mobile/src/components/
// GetStarted, JoinCommunityOptions, OpenInviteLink, JoinCommunity, LinkDevices)
// need a react-native runtime and do not render under this webpack build.

const noop = () => {}

const Column: React.FC<{ width: number; label: string; children: React.ReactNode }> = ({ width, label, children }) => (
  <div style={{ flex: `0 0 ${width}px`, minWidth: 0 }}>
    <div
      style={{
        fontFamily: mono,
        fontSize: 11,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: INK_3,
        borderTop: `2px solid ${RULE}`,
        paddingTop: 8,
        marginBottom: 12,
      }}
    >
      {label}
    </div>
    <div style={{ border: `1px solid ${RULE}`, background: '#fff', width }}>{children}</div>
  </div>
)

const Screen: React.FC<{ title: string; figma: string; note?: string; render: () => React.ReactNode }> = ({
  title,
  figma,
  note,
  render,
}) => (
  <StyledEngineProvider injectFirst>
    <ThemeProvider theme={lightTheme}>
      <div style={{ padding: 24, fontFamily: "'Rubik', sans-serif", color: '#171B12' }}>
        <h1 style={{ fontSize: 26, lineHeight: '34px', fontWeight: 500, margin: '0 0 4px', letterSpacing: '-0.02em' }}>
          {title}
        </h1>
        <p style={{ fontSize: 13, lineHeight: '19px', color: INK_3, margin: '0 0 16px' }}>
          Figma <span style={{ fontFamily: mono }}>{figma}</span> · desktop component under the app&rsquo;s light theme
          {note ? ` · ${note}` : ''}
        </p>
        <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start', overflowX: 'auto', paddingBottom: 8 }}>
          <Column width={600} label='desktop · 600px modal body'>
            {render()}
          </Column>
          <Column width={375} label='same component · 375px (prototype width; RN screen not renderable here)'>
            {render()}
          </Column>
        </div>
      </div>
    </ThemeProvider>
  </StyledEngineProvider>
)

export default {
  title: 'Screens/Onboarding',
  parameters: { layout: 'fullscreen', chromatic: { disableSnapshot: true } },
}

export const GetStarted = () => (
  <Screen
    title='Get started'
    figma='2811:2550'
    render={() => <GetStartedComponent onJoinCommunity={noop} onCreateCommunity={noop} onLinkDevices={noop} />}
  />
)

export const JoinCommunity = () => (
  <Screen
    title='Join community'
    figma='2811:2562'
    note='Recover account has no mechanism yet and is disabled'
    render={() => <JoinCommunityOptionsComponent onJoinWithInviteLink={noop} onJoinWithQrCode={noop} />}
  />
)

export const OpenInviteLink = () => (
  <Screen title='Open invite link' figma='2811:2455' render={() => <OpenInviteLinkComponent onPasteLink={noop} />} />
)

export const PasteALink = () => (
  <Screen
    title='Paste a link to Join'
    figma='3190:10892'
    note='the WIP frame reduced to its intent: heading, one input ("Link"), Continue'
    render={() => <PasteLinkComponent heading={'Paste a link to Join'} handleCommunityAction={noop} />}
  />
)

export const JoinWithQrCode = () => (
  <Screen
    title='Join with QR code'
    figma='2811:2460'
    note='desktop has no camera: the sheet becomes the paste step'
    render={() => <PasteLinkComponent heading={'Join with QR code'} handleCommunityAction={noop} />}
  />
)

export const CreateCommunity = () => (
  <Screen
    title='Create a community'
    figma='2811:2451'
    note='community icon upload is phase 2'
    render={() => <CreateCommunityComponent handleCommunityAction={noop} />}
  />
)

export const LinkDevices = () => (
  <Screen
    title='Link devices'
    figma='2811:2575'
    render={() => (
      <LinkDevicesComponent
        onDisplayQrCode={noop}
        onScanQrCode={noop}
        linkedDevices={[
          { deviceId: 'this', deviceName: 'this device', isCurrent: true },
          { deviceId: 'other', deviceName: 'nyc-laptop', isCurrent: false },
        ]}
      />
    )}
  />
)

export const LinkDevicesEmpty = () => (
  <Screen
    title='Link devices · no linked devices'
    figma='2811:2575'
    render={() => <LinkDevicesComponent onDisplayQrCode={noop} onScanQrCode={noop} linkedDevices={[]} />}
  />
)

export const DisplayQrCode = () => (
  <Screen
    title='Display QR code'
    figma='2811:2601'
    note="#3400's Linked devices surface, shown inside the Link devices modal"
    render={() => (
      <div style={{ padding: 32 }}>
        <LinkedDevicesComponent
          deviceLink={'https://tryquiet.org/join#example-device-link'}
          isLoading={false}
          revealLink={false}
          onToggleLinkVisibility={noop}
        />
      </div>
    )}
  />
)

export const ScanQrCode = () => (
  <Screen
    title='Scan QR code'
    figma='2811:2587'
    note='desktop has no camera: the sheet copy introduces the paste step'
    render={() => (
      <PasteLinkComponent
        heading={'Scan QR code'}
        intro={'Go to “Link devices” on the other device and display the QR code. Scan it to link devices.'}
        handleCommunityAction={noop}
      />
    )}
  />
)
