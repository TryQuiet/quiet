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
import { QrScannerComponent } from '../../components/Onboarding/qrScanner/QrScannerComponent'
import { installStoryCamera, type StoryCamera } from './storyCamera'

import { CreateUsernameBody } from '../../components/CreateUsername/CreateUsernameComponent'
import { CONTENT_COLUMN_WIDTH, OnboardingBody } from '../../components/Onboarding/OnboardingBody'
import BackIcon from '@mui/icons-material/ArrowBack'
import CloseIcon from '@mui/icons-material/Close'
import { composeInvitationShareUrl, validInvitationDatav4 } from '@quiet/common'
import { InvitationKind, isDeviceInvitationData } from '@quiet/types'
import type { InvitationData } from '@quiet/types'

// The implemented onboarding screens, one story each, plus a walkthrough that
// wires them together with in-story state (bottom of the file). Left: the desktop
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

// @quiet/common's invitation fixtures, composed by the app's own composeInvitationShareUrl.
const SAMPLE_MEMBER_LINK = composeInvitationShareUrl({ ...validInvitationDatav4[0], kind: InvitationKind.Member })
const SAMPLE_DEVICE_LINK = composeInvitationShareUrl({
  ...validInvitationDatav4[0],
  kind: InvitationKind.Device,
  authData: {
    ...validInvitationDatav4[0].authData,
    userId: 'q5ck86uuhihx5w00zhknit60',
    userName: 'Alice device owner',
  },
})

const SCAN_QR_INTRO = 'Go to “Link devices” on the other device and display the QR code. Scan it to link devices.'

/** The third row is not in 2811:2575: the user asked for it on 2026-09-13; its label is undesigned. */
const LINK_DEVICES_NOTE =
  'the Paste link row is a user addition (2026-09-13) with the library link glyph; its label is undesigned'

/** Type a value into every paste input under `root` the way a user would (React sees a native input event). */
const fillPasteInputs = (root: HTMLElement | null, value: string) => {
  if (!root) return
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
  root.querySelectorAll<HTMLInputElement>('input[data-testid="paste-link-input"]').forEach(input => {
    setter?.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

/** What JoinCommunity.tsx / LinkDevices.tsx dispatch for a decoded code, recorded under the columns. */
const describeInvitation = (data: InvitationData) =>
  isDeviceInvitationData(data)
    ? `communities.actions.linkDevice({ inviteData }) · device link · ${data.authData.userName}`
    : `communities.actions.joinCommunity({ inviteData }) · member link · ${data.authData.communityName}`

/**
 * No camera exists under Storybook; `installStoryCamera` makes getUserMedia return a
 * canvas stream (a real QR code of a real fixture link, a blank feed, or the failure
 * modes), so the real <video> → canvas → jsQR pipeline runs in the stories.
 */
const WithCamera: React.FC<{ camera: StoryCamera; children: React.ReactNode }> = ({ camera, children }) => {
  const current = React.useRef(camera)
  current.current = camera
  React.useLayoutEffect(() => installStoryCamera(() => current.current), [])
  return <>{children}</>
}

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

type ShellLeft = 'back' | 'close' | 'none'

/** The Modal full-window shell as the app's Modal renders it: 60px header, back arrow (or close) left, title centered. */
const Shell: React.FC<{ title: string; left?: ShellLeft; onLeft?: () => void; children: React.ReactNode }> = ({
  title,
  left = 'back',
  onLeft,
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
      <div style={{ width: 60, display: 'flex', justifyContent: 'center' }}>
        {left === 'none' ? null : (
          <button
            type='button'
            aria-label={left}
            data-testid={`shell-${left}`}
            onClick={onLeft}
            style={{
              border: 0,
              background: 'none',
              padding: 0,
              display: 'flex',
              cursor: onLeft ? 'pointer' : 'default',
            }}
          >
            {left === 'back' ? <BackIcon /> : <CloseIcon />}
          </button>
        )}
      </div>
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
  left?: ShellLeft
  note?: string
  render: () => React.ReactNode
}> = ({ title, bar, figma, left, note, render }) => (
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
            <Shell title={bar} left={left}>
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
    left='none'
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

// ---------------------------------------------------------------------------
// The scanner sheets. The prototype draws one state: the camera. The requesting,
// denied and no-camera states have no frame; their copy is the implementation's
// minimum (QrScannerComponent SCANNER_COPY), not the designer's.

const ScannerScreen: React.FC<{
  title: string
  bar: string
  figma: string
  note: string
  intro?: string
  camera: StoryCamera
}> = ({ title, bar, figma, note, intro, camera }) => {
  const [decoded, setDecoded] = React.useState<string[]>([])
  const record = (entry: string) => setDecoded(list => [...list, entry])
  return (
    <WithCamera camera={camera}>
      <Screen
        title={title}
        bar={bar}
        figma={figma}
        note={note}
        render={() => (
          <QrScannerComponent
            intro={intro}
            onDecoded={data => record(describeInvitation(data))}
            onUsePasteLink={() => record('→ Paste a link to Join (the paste step)')}
          />
        )}
      />
      <div
        style={{ fontFamily: mono, fontSize: 12, lineHeight: '18px', color: INK_3, padding: '0 24px 24px' }}
        data-testid='scanner-dispatched'
      >
        dispatched, both columns ({decoded.length}):{decoded.length === 0 ? ' —' : null}
        {decoded.map((entry, i) => (
          <div key={i} style={{ color: '#171B12' }}>
            {i + 1}. {entry}
          </div>
        ))}
      </div>
    </WithCamera>
  )
}

export const JoinWithQrCode = () => (
  <ScannerScreen
    title='Join with QR code'
    bar='Join with QR code'
    figma='2811:2460'
    note='scanning; the camera is a canvas stream with no code in view'
    camera={{ kind: 'blank' }}
  />
)

export const JoinWithQrCodeRequesting = () => (
  <ScannerScreen
    title='Join with QR code · requesting camera access'
    bar='Join with QR code'
    figma='2811:2460'
    note='no frame in the prototype for this state; getUserMedia never settles here'
    camera={{ kind: 'pending' }}
  />
)

export const JoinWithQrCodeDecoded = () => (
  <ScannerScreen
    title='Join with QR code · decoded'
    bar='Join with QR code'
    figma='2811:2460'
    note='the camera shows a QR code of the sample member link; the decoded link is dispatched below and the camera released'
    camera={{ kind: 'code', text: SAMPLE_MEMBER_LINK }}
  />
)

export const JoinWithQrCodeInvalid = () => (
  <ScannerScreen
    title='Join with QR code · not an invitation'
    bar='Join with QR code'
    figma='2811:2460'
    note="the camera shows a QR code of https://example.com/: the paste field's error, scanning continues"
    camera={{ kind: 'code', text: 'https://example.com/' }}
  />
)

export const JoinWithQrCodeDenied = () => (
  <ScannerScreen
    title='Join with QR code · camera denied'
    bar='Join with QR code'
    figma='2811:2460'
    note='no frame in the prototype for this state; the copy is the minimum, "Paste a link" routes to the paste step'
    camera={{ kind: 'denied' }}
  />
)

export const JoinWithQrCodeNoCamera = () => (
  <ScannerScreen
    title='Join with QR code · no camera'
    bar='Join with QR code'
    figma='2811:2460'
    note='no frame in the prototype for this state; the copy is the minimum, "Paste a link" routes to the paste step'
    camera={{ kind: 'none' }}
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
    note={LINK_DEVICES_NOTE}
    render={() => (
      <LinkDevicesComponent
        onDisplayQrCode={noop}
        onScanQrCode={noop}
        onPasteLink={noop}
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
    note={LINK_DEVICES_NOTE}
    render={() => (
      <LinkDevicesComponent onDisplayQrCode={noop} onScanQrCode={noop} onPasteLink={noop} linkedDevices={[]} />
    )}
  />
)

// Link devices → Paste link: the existing paste step under the Link devices title bar,
// narrowed to device links. No frame; the row and the error copy are the user's
// (2026-09-13), not the designer's.
const PASTE_LINK_NOTE =
  'no frame — the Paste link row is a user addition (2026-09-13); the paste step is 3190:10892 narrowed to device links'

export const PasteLinkOnLinkDevices = () => (
  <Screen
    title='Paste link'
    bar='Link devices'
    figma='—'
    note={PASTE_LINK_NOTE}
    render={() => (
      <PasteLinkComponent heading={'Paste a link to Join'} linkKind='device' handleCommunityAction={noop} />
    )}
  />
)

/** Fills every paste input under `root` with `link` and submits, so the story shows the real error path. */
const SubmitOnMount: React.FC<{ link: string; children: React.ReactNode }> = ({ link, children }) => {
  const rootRef = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    fillPasteInputs(rootRef.current, link)
    const timer = window.setTimeout(() => {
      rootRef.current
        ?.querySelectorAll<HTMLButtonElement>('button[data-testid="continue-joinCommunity"]')
        .forEach(button => button.click())
    }, 0)
    return () => window.clearTimeout(timer)
  }, [link])
  return <div ref={rootRef}>{children}</div>
}

export const PasteLinkNotADeviceLink = () => (
  <SubmitOnMount link={SAMPLE_MEMBER_LINK}>
    <Screen
      title='Paste link · not a device link'
      bar='Link devices'
      figma='—'
      note={`${PASTE_LINK_NOTE}; the sample member link was pasted and submitted — the error copy is undesigned`}
      render={() => (
        <PasteLinkComponent
          heading={'Paste a link to Join'}
          linkKind='device'
          revealInputValue
          handleCommunityAction={noop}
        />
      )}
    />
  </SubmitOnMount>
)

export const DisplayQrCode = () => (
  <Screen
    title='Display QR code'
    bar='QR code'
    figma='2811:2601'
    note="#3400's Linked devices surface, shown inside the Link devices modal"
    render={() => (
      <OnboardingBody dataTestId='link-devices-display'>
        <LinkedDevicesComponent
          deviceLink={'https://tryquiet.org/join#example-device-link'}
          isLoading={false}
          revealLink={false}
          onToggleLinkVisibility={noop}
          centered
        />
      </OnboardingBody>
    )}
  />
)

export const ScanQrCode = () => (
  <ScannerScreen
    title='Scan QR code'
    bar='Scan QR code'
    figma='2811:2587'
    note='scanning, with the sheet copy above the camera; the camera is a canvas stream with no code in view'
    intro={SCAN_QR_INTRO}
    camera={{ kind: 'blank' }}
  />
)

export const ScanQrCodeDecoded = () => (
  <ScannerScreen
    title='Scan QR code · decoded'
    bar='Scan QR code'
    figma='2811:2587'
    note='the camera shows a QR code of the sample device link; linkDevice is dispatched below and the camera released'
    intro={SCAN_QR_INTRO}
    camera={{ kind: 'code', text: SAMPLE_DEVICE_LINK }}
  />
)

export const ScanQrCodeDenied = () => (
  <ScannerScreen
    title='Scan QR code · camera denied'
    bar='Scan QR code'
    figma='2811:2587'
    note='no frame in the prototype for this state; the copy is the minimum, "Paste a link" routes to the paste step'
    intro={SCAN_QR_INTRO}
    camera={{ kind: 'denied' }}
  />
)

export const ChooseUsername = () => (
  <Screen
    title='Choose username'
    bar='Create a community'
    left='close'
    figma='2811:2371'
    note="the prototype's copy; the library's Register username is stale"
    render={() => <CreateUsernameBody registerUsername={noop} />}
  />
)

// ---------------------------------------------------------------------------
// Walkthrough: the same screens wired together with in-story state. Rows,
// buttons and the shell's back arrow navigate the way the app's containers do
// (GetStarted, JoinCommunity, CreateCommunity, CreateUsername, LinkDevices);
// where a container would dispatch, the story records the action under the
// columns instead. Both columns render the same step; each column's inputs are
// its own. The sample links are @quiet/common's invitation fixtures, composed
// by the app's own composeInvitationShareUrl.

type Step =
  | 'getStarted'
  | 'joinCommunity'
  | 'openInviteLink'
  | 'pasteALink'
  | 'joinWithQrCode'
  | 'createCommunity'
  | 'chooseUsername'
  | 'linkDevices'
  | 'displayQrCode'
  | 'scanQrCode'
  | 'pasteFromScan'
  | 'pasteLinkDevice'

const STEPS: Record<Step, { title: string; bar: string; left: ShellLeft }> = {
  getStarted: { title: 'Get started', bar: 'Quiet', left: 'none' },
  joinCommunity: { title: 'Join community', bar: 'Quiet', left: 'back' },
  openInviteLink: { title: 'Open invite link', bar: 'Join with invite link', left: 'back' },
  pasteALink: { title: 'Paste a link to Join', bar: 'Join with invite link', left: 'back' },
  joinWithQrCode: { title: 'Join with QR code', bar: 'Join with QR code', left: 'back' },
  createCommunity: { title: 'Create a community', bar: 'Create a community', left: 'back' },
  chooseUsername: { title: 'Choose username', bar: 'Create a community', left: 'close' },
  linkDevices: { title: 'Link devices', bar: 'Link devices', left: 'back' },
  displayQrCode: { title: 'Display QR code', bar: 'QR code', left: 'back' },
  scanQrCode: { title: 'Scan QR code', bar: 'Scan QR code', left: 'back' },
  pasteFromScan: { title: 'Paste a link to Join', bar: 'Scan QR code', left: 'back' },
  pasteLinkDevice: { title: 'Paste a link to Join', bar: 'Link devices', left: 'back' },
}

const PASTE_STEPS: Step[] = ['pasteALink', 'pasteFromScan', 'pasteLinkDevice']

/** What the walkthrough's camera shows; the code is the sample link the current step expects. */
type WalkthroughCamera = 'code' | 'blank' | 'denied' | 'none'
const WALKTHROUGH_CAMERAS: WalkthroughCamera[] = ['code', 'blank', 'denied', 'none']

const WALKTHROUGH_DEVICES = [
  { deviceId: 'this', deviceName: 'this device', isCurrent: true },
  { deviceId: 'other', deviceName: 'nyc-laptop', isCurrent: false },
]

const chromeButton: React.CSSProperties = {
  fontFamily: mono,
  fontSize: 11,
  padding: '4px 8px',
  border: `1px solid ${RULE}`,
  background: '#fff',
  color: '#171B12',
  cursor: 'pointer',
}

const WalkthroughStory = () => {
  const [step, setStep] = React.useState<Step>('getStarted')
  const [trail, setTrail] = React.useState<Step[]>([])
  const [dispatched, setDispatched] = React.useState<string[]>([])
  const [revealLink, setRevealLink] = React.useState(false)
  const [cameraMode, setCameraMode] = React.useState<WalkthroughCamera>('code')
  const rootRef = React.useRef<HTMLDivElement>(null)

  // The story camera (see WithCamera) follows the step: Join with QR code sees the sample
  // member link, Scan QR code the sample device link.
  const camera: StoryCamera =
    cameraMode === 'code'
      ? { kind: 'code', text: step === 'scanQrCode' ? SAMPLE_DEVICE_LINK : SAMPLE_MEMBER_LINK }
      : { kind: cameraMode }

  const go = (next: Step) => {
    setTrail([...trail, step])
    setStep(next)
  }
  const back = () => {
    const prev = trail[trail.length - 1]
    if (!prev) return
    setTrail(trail.slice(0, -1))
    setStep(prev)
  }
  const record = (action: string) => setDispatched(d => [...d, action])
  /** The container closes its modal and the joining panel takes over; the story returns to the entry screen. */
  const finish = () => {
    setTrail([])
    setStep('getStarted')
  }
  const restart = () => {
    finish()
    setDispatched([])
  }

  // JoinCommunity.tsx / LinkDevices.tsx: a device link links this device, a member link joins and asks for a username.
  const onInvitation = (data: InvitationData) => {
    if (isDeviceInvitationData(data)) {
      record('communities.actions.linkDevice({ inviteData })')
      finish()
      return
    }
    record('communities.actions.joinCommunity({ inviteData })')
    go('chooseUsername')
  }
  // CreateCommunity.tsx without QSS_ALLOWED.
  const onCreate = (name: string) => {
    record(`communities.actions.createCommunity({ name: '${name}', useServer: false })`)
    go('chooseUsername')
  }
  // CreateUsername.tsx
  const onRegister = (nickname: string) => {
    record(`identity.actions.registerUsername({ nickname: '${nickname}' })`)
    finish()
  }
  // LinkDevices.tsx refreshes the device list when its modal opens.
  const openLinkDevices = () => {
    record('connection.actions.getLinkedDevices()')
    go('linkDevices')
  }

  const render = () => {
    switch (step) {
      case 'getStarted':
        return (
          <GetStartedComponent
            onJoinCommunity={() => go('joinCommunity')}
            onCreateCommunity={() => go('createCommunity')}
            onLinkDevices={openLinkDevices}
          />
        )
      case 'joinCommunity':
        return (
          <JoinCommunityOptionsComponent
            onJoinWithInviteLink={() => go('openInviteLink')}
            onJoinWithQrCode={() => go('joinWithQrCode')}
          />
        )
      case 'openInviteLink':
        return <OpenInviteLinkComponent onPasteLink={() => go('pasteALink')} />
      case 'pasteALink':
        return <PasteLinkComponent heading={'Paste a link to Join'} handleCommunityAction={onInvitation} />
      case 'joinWithQrCode':
        return <QrScannerComponent onDecoded={onInvitation} onUsePasteLink={() => go('pasteALink')} />
      case 'createCommunity':
        return <CreateCommunityComponent handleCommunityAction={onCreate} />
      case 'chooseUsername':
        return <CreateUsernameBody registerUsername={onRegister} />
      case 'linkDevices':
        return (
          <LinkDevicesComponent
            onDisplayQrCode={() => go('displayQrCode')}
            onScanQrCode={() => go('scanQrCode')}
            onPasteLink={() => go('pasteLinkDevice')}
            linkedDevices={WALKTHROUGH_DEVICES}
          />
        )
      case 'displayQrCode':
        return (
          <OnboardingBody dataTestId='link-devices-display'>
            <LinkedDevicesComponent
              deviceLink={SAMPLE_DEVICE_LINK}
              isLoading={false}
              revealLink={revealLink}
              onToggleLinkVisibility={() => setRevealLink(v => !v)}
              linkedDevices={WALKTHROUGH_DEVICES}
              centered
            />
          </OnboardingBody>
        )
      case 'scanQrCode':
        return (
          <QrScannerComponent
            intro={SCAN_QR_INTRO}
            onDecoded={onInvitation}
            onUsePasteLink={() => go('pasteFromScan')}
            dataTestId='link-devices-scanner'
          />
        )
      // LinkDevices.tsx: pasted in the Link devices flow, only a device link is accepted.
      case 'pasteFromScan':
      case 'pasteLinkDevice':
        return (
          <PasteLinkComponent heading={'Paste a link to Join'} linkKind='device' handleCommunityAction={onInvitation} />
        )
    }
  }

  const { title, bar, left } = STEPS[step]
  const isPasteStep = PASTE_STEPS.includes(step)
  const onLeft = left === 'back' ? back : left === 'close' ? restart : undefined

  return (
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={lightTheme}>
        <WithCamera camera={camera}>
          <div ref={rootRef} style={{ padding: 24, fontFamily: "'Rubik', sans-serif", color: '#171B12' }}>
            <h1
              style={{ fontSize: 26, lineHeight: '34px', fontWeight: 500, margin: '0 0 4px', letterSpacing: '-0.02em' }}
            >
              Walkthrough · {title}
            </h1>
            <p style={{ fontSize: 13, lineHeight: '19px', color: INK_3, margin: '0 0 16px' }}>
              title bar &ldquo;{bar}&rdquo; · rows, buttons and the back arrow navigate; where the app dispatches, the
              action is recorded below · trail:{' '}
              <span style={{ fontFamily: mono }} data-testid='walkthrough-trail'>
                {[...trail, step].map(s => STEPS[s].title).join(' › ')}
              </span>
            </p>
            <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start', overflowX: 'auto', paddingBottom: 8 }}>
              <Column width={SHELL_WIDTH} label='desktop · modal full-window shell (715) · 375 column centered'>
                <Shell title={bar} left={left} onLeft={onLeft}>
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
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
              <button type='button' style={chromeButton} onClick={restart} data-testid='walkthrough-restart'>
                restart
              </button>
              {WALKTHROUGH_CAMERAS.map(mode => (
                <button
                  key={mode}
                  type='button'
                  style={{ ...chromeButton, fontWeight: mode === cameraMode ? 700 : 400 }}
                  onClick={() => setCameraMode(mode)}
                  data-testid={`walkthrough-camera-${mode}`}
                >
                  camera: {mode === 'code' ? 'sample link QR code' : mode}
                </button>
              ))}
              {isPasteStep && (
                <>
                  <button
                    type='button'
                    style={chromeButton}
                    onClick={() => fillPasteInputs(rootRef.current, SAMPLE_MEMBER_LINK)}
                    data-testid='walkthrough-fill-member-link'
                  >
                    fill both inputs with the sample member link
                  </button>
                  <button
                    type='button'
                    style={chromeButton}
                    onClick={() => fillPasteInputs(rootRef.current, SAMPLE_DEVICE_LINK)}
                    data-testid='walkthrough-fill-device-link'
                  >
                    fill both inputs with the sample device link
                  </button>
                </>
              )}
            </div>
            <div
              style={{ fontFamily: mono, fontSize: 12, lineHeight: '18px', color: INK_3, marginTop: 12 }}
              data-testid='walkthrough-dispatched'
            >
              dispatched ({dispatched.length}):
              {dispatched.length === 0 ? ' —' : null}
              {dispatched.map((action, i) => (
                <div key={i} style={{ color: '#171B12' }}>
                  {i + 1}. {action}
                </div>
              ))}
            </div>
          </div>
        </WithCamera>
      </ThemeProvider>
    </StyledEngineProvider>
  )
}

export const Walkthrough = () => <WalkthroughStory />
