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

import { CreateUsernameBody } from '../../components/CreateUsername/CreateUsernameComponent'
import { CONTENT_COLUMN_WIDTH } from '../../components/Onboarding/OnboardingBody'
import BackIcon from '@mui/icons-material/ArrowBack'

// The implemented onboarding screens, one story each. Left: the desktop
// Modal full-window shell (715 wide — the library's 5825:29938: back arrow,
// centered title, the same 375-wide content column centered underneath; the
// mac-style top container is the window itself). Right: the bare 375 column,
// i.e. the prototype's width. Both are the DESKTOP components: the React
// Native screens (packages/mobile/src/components/GetStarted,
// JoinCommunityOptions, OpenInviteLink, JoinCommunity, LinkDevices,
// Registration) need a react-native runtime and do not render under this
// webpack build.

const SHELL_WIDTH = 715
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

/** The Modal full-window shell as the app's Modal renders it: 60px header, back arrow left, title centered. */
const Shell: React.FC<{ title: string; back?: boolean; children: React.ReactNode }> = ({
  title,
  back = true,
  children,
}) => (
  <div style={{ width: SHELL_WIDTH, minHeight: 560, background: '#fff' }}>
    <div
      style={{
        height: 60,
        display: 'flex',
        alignItems: 'center',
        borderBottom: `1px solid #F0F0F0`,
        fontFamily: "'Rubik', sans-serif",
      }}
    >
      <div style={{ width: 60, display: 'flex', justifyContent: 'center' }}>{back ? <BackIcon /> : null}</div>
      <div style={{ flex: 1, textAlign: 'center', fontSize: 16, lineHeight: '24px', fontWeight: 500 }}>{title}</div>
      <div style={{ width: 60 }} />
    </div>
    {children}
  </div>
)

const Screen: React.FC<{
  title: string
  bar: string
  figma: string
  back?: boolean
  note?: string
  render: () => React.ReactNode
}> = ({ title, bar, figma, back, note, render }) => (
  <StyledEngineProvider injectFirst>
    <ThemeProvider theme={lightTheme}>
      <div style={{ padding: 24, fontFamily: "'Rubik', sans-serif", color: '#171B12' }}>
        <h1 style={{ fontSize: 26, lineHeight: '34px', fontWeight: 500, margin: '0 0 4px', letterSpacing: '-0.02em' }}>
          {title}
        </h1>
        <p style={{ fontSize: 13, lineHeight: '19px', color: INK_3, margin: '0 0 16px' }}>
          Figma <span style={{ fontFamily: mono }}>{figma}</span> · title bar &ldquo;{bar}&rdquo; · desktop component
          under the app&rsquo;s light theme{note ? ` · ${note}` : ''}
        </p>
        <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start', overflowX: 'auto', paddingBottom: 8 }}>
          <Column width={SHELL_WIDTH} label='desktop · modal full-window shell (715) · 375 column centered'>
            <Shell title={bar} back={back}>
              {render()}
            </Shell>
          </Column>
          <Column
            width={CONTENT_COLUMN_WIDTH}
            label='the same column · 375 (prototype width; RN screen not renderable here)'
          >
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
    bar='Quiet'
    back={false}
    figma='2811:2550'
    render={() => <GetStartedComponent onJoinCommunity={noop} onCreateCommunity={noop} onLinkDevices={noop} />}
  />
)

export const JoinCommunity = () => (
  <Screen
    title='Join community'
    bar='Quiet'
    figma='2811:2562'
    note='Recover account has no mechanism yet and is disabled'
    render={() => <JoinCommunityOptionsComponent onJoinWithInviteLink={noop} onJoinWithQrCode={noop} />}
  />
)

export const OpenInviteLink = () => (
  <Screen
    title='Open invite link'
    bar='Join with invite link'
    figma='2811:2455'
    render={() => <OpenInviteLinkComponent onPasteLink={noop} />}
  />
)

export const PasteALink = () => (
  <Screen
    title='Paste a link to Join'
    bar='Join with invite link'
    figma='3190:10892'
    note='the WIP frame reduced to its intent: heading, one input ("Link"), Continue'
    render={() => <PasteLinkComponent heading={'Paste a link to Join'} handleCommunityAction={noop} />}
  />
)

export const JoinWithQrCode = () => (
  <Screen
    title='Join with QR code'
    bar='Join with QR code'
    figma='2811:2460'
    note='desktop has no camera: the sheet becomes the paste step'
    render={() => <PasteLinkComponent heading={'Join with QR code'} handleCommunityAction={noop} />}
  />
)

export const CreateCommunity = () => (
  <Screen
    title='Create a community'
    bar='Create a community'
    figma='2811:2451'
    note='community icon upload is phase 2'
    render={() => <CreateCommunityComponent handleCommunityAction={noop} />}
  />
)

export const LinkDevices = () => (
  <Screen
    title='Link devices'
    bar='Link devices'
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
    bar='Link devices'
    figma='2811:2575'
    render={() => <LinkDevicesComponent onDisplayQrCode={noop} onScanQrCode={noop} linkedDevices={[]} />}
  />
)

export const DisplayQrCode = () => (
  <Screen
    title='Display QR code'
    bar='QR code'
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
    bar='Scan QR code'
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

export const ChooseUsername = () => (
  <Screen
    title='Choose username'
    bar='Create a community'
    figma='2811:2371'
    note="the prototype's copy; the library's Register username is stale"
    render={() => <CreateUsernameBody registerUsername={noop} />}
  />
)
