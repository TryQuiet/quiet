import React from 'react'
import { ThemeProvider, StyledEngineProvider } from '@mui/material/styles'

import { lightTheme } from '../../theme'
import { INK_3, mono, RULE } from '../specimen/ui'

import { GetStartedComponent } from '../../components/Onboarding/GetStartedComponent'
import { JoinCommunityOptionsComponent } from '../../components/Onboarding/JoinCommunityOptionsComponent'
import { RecoverAccountComponent } from '../../components/Onboarding/RecoverAccountComponent'
import { OpenInviteLinkComponent } from '../../components/Onboarding/OpenInviteLinkComponent'
import { PasteLinkComponent } from '../../components/Onboarding/PasteLinkComponent'
import { CreateCommunityComponent } from '../../components/Onboarding/CreateCommunityComponent'
import { LinkDevicesComponent } from '../../components/Onboarding/LinkDevicesComponent'
import { DisplayQrCodeComponent } from '../../components/Onboarding/DisplayQrCodeComponent'
import { QrScannerComponent } from '../../components/Onboarding/qrScanner/QrScannerComponent'
import { installStoryCamera, type StoryCamera } from './storyCamera'

import { CreateUsernameBody } from '../../components/CreateUsername/CreateUsernameComponent'
import { CONTENT_COLUMN_WIDTH, OnboardingBody } from '../../components/Onboarding/OnboardingBody'
import BackIcon from '@mui/icons-material/ArrowBack'
import CloseIcon from '@mui/icons-material/Close'
import { composeInvitationDeepUrl, composeInvitationShareUrl, validInvitationDatav4 } from '@quiet/common'
import { InvitationKind, isDeviceInvitationData } from '@quiet/types'
import type { InvitationData, LinkedDevice } from '@quiet/types'

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

/**
 * What JoinCommunity.tsx / LinkDevices.tsx do with a decoded code, recorded under the columns.
 *
 * A member link joins straight away. A device link does not: both containers raise the device-link
 * consent sheet and only dispatch `linkDevice` once it is confirmed, because a camera decodes
 * whatever is put in front of it and that is not consent to hand this account to another device.
 * The scanner itself is what these stories render, so the consent sheet is named here rather than
 * drawn.
 */
const describeInvitation = (data: InvitationData) =>
  isDeviceInvitationData(data)
    ? `device link · ${data.authData.userName} → device-link consent, then communities.actions.linkDevice({ inviteData, deviceLinkConsent: true })`
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

/**
 * The Modal full-window shell as the app's Modal renders it: 60px header, back
 * arrow (or close) left, title centered. `withoutTitle` = the bar zone with the
 * glyph only, no title text (the full-screen h1 stages, as the prototype hides
 * their titles — ONBOARDING.md "No top bar title on full-screen h1 stages"). No
 * `title` and no `withoutTitle` = no bar (Get started: the window chrome is the
 * bar), the content column starting at the top.
 */
const Shell: React.FC<{
  title?: string
  withoutTitle?: boolean
  left?: ShellLeft
  onLeft?: () => void
  children: React.ReactNode
}> = ({ title, withoutTitle = false, left = 'back', onLeft, children }) => (
  <div style={{ width: SHELL_WIDTH, minHeight: 560, background: '#fff' }}>
    {title === undefined && !withoutTitle ? null : (
      <div
        style={{
          height: 60,
          display: 'flex',
          alignItems: 'center',
          // No hairline: the app's Modal draws one only for a caller that passes
          // `addBorder`, which defaults to false and which neither onboarding modal sets.
          borderBottom: 'none',
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
        <div
          data-testid='shell-title'
          style={{ flex: 1, textAlign: 'center', fontSize: 16, lineHeight: '24px', fontWeight: 500 }}
        >
          {withoutTitle ? null : title}
        </div>
        <div style={{ width: 60 }} />
      </div>
    )}
    {children}
  </div>
)

/**
 * Caption for a screen's bar: a title the frame shows, a title the frame itself
 * hides (glyph only), a title dropped here because the screen carries its own
 * large heading, or no bar at all.
 */
const barCaption = (bar?: string, hiddenBar?: string, droppedBar?: string) =>
  bar !== undefined ? (
    <>title bar &ldquo;{bar}&rdquo;</>
  ) : hiddenBar !== undefined ? (
    <>no bar title, glyph only (the frame hides &ldquo;{hiddenBar}&rdquo;)</>
  ) : droppedBar !== undefined ? (
    <>no bar title, glyph only (the frame draws &ldquo;{droppedBar}&rdquo;; dropped — the screen has its own heading)</>
  ) : (
    'no title bar'
  )

const Screen: React.FC<{
  title: string
  /** Title-bar text (a bar the frame shows and this screen keeps). */
  bar?: string
  /** The frame's title text the designer hid: the bar zone shows the glyph only, no title, no hairline. */
  hiddenBar?: string
  /** A title the frame draws but this screen drops, because it has a large heading of its own. */
  droppedBar?: string
  figma: string
  left?: ShellLeft
  note?: string
  render: () => React.ReactNode
}> = ({ title, bar, hiddenBar, droppedBar, figma, left, note, render }) => (
  <StyledEngineProvider injectFirst>
    <ThemeProvider theme={lightTheme}>
      <div style={{ padding: 24, fontFamily: "'Rubik', sans-serif", color: '#171B12' }}>
        <h1 style={{ fontSize: 26, lineHeight: '34px', fontWeight: 500, margin: '0 0 4px', letterSpacing: '-0.02em' }}>
          {title}
        </h1>
        <p style={{ fontSize: 13, lineHeight: '19px', color: INK_3, margin: '0 0 16px' }}>
          Figma <span style={{ fontFamily: mono }}>{figma}</span> · {barCaption(bar, hiddenBar, droppedBar)} · desktop
          component under the app&rsquo;s light theme{note ? ` · ${note}` : ''}
        </p>
        <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start', overflowX: 'auto', paddingBottom: 8 }}>
          <Column width={SHELL_WIDTH} label='desktop · modal full-window shell (715) · 375 column centered'>
            <Shell title={bar} withoutTitle={hiddenBar !== undefined || droppedBar !== undefined} left={left}>
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
    left='none'
    figma='2811:2550'
    note='the entry: Onboarding/GetStarted.tsx opens it as soon as the app is connected without a community, and the other onboarding modals return to it; no title bar on either platform — the window chrome already says Quiet on desktop and the bar did not feel right on mobile (decided 2026-09-13, a deliberate departure from the frame)'
    render={() => <GetStartedComponent onJoinCommunity={noop} onCreateCommunity={noop} onLinkDevices={noop} />}
  />
)

export const JoinCommunity = () => (
  <Screen
    title='Join community'
    hiddenBar='Quiet'
    figma='2811:2562'
    note='Recover account opens Account recovery (below)'
    render={() => (
      <JoinCommunityOptionsComponent onJoinWithInviteLink={noop} onJoinWithQrCode={noop} onRecoverAccount={noop} />
    )}
  />
)

export const RecoverAccount = () => (
  <Screen
    title='Recover account'
    hiddenBar='Account recovery'
    figma='2811:2535'
    note='Use linked device → Link devices (whose back arrow returns here), Use invite link → Join with invite link (the prototype’s links); the frame’s third row, More options, goes nowhere in the design, so it is omitted until the design gives it a target (user, 2026-09-22); no recovery mechanism exists'
    render={() => <RecoverAccountComponent onUseLinkedDevice={noop} onUseInviteLink={noop} />}
  />
)

export const OpenInviteLink = () => (
  <Screen
    title='Open invite link'
    hiddenBar='Join with invite link'
    figma='2811:2455'
    note='an invite link opened here takes the deep-link path (customProtocol.saga.ts) straight to Choose username; Paste a link is the fallback'
    render={() => <OpenInviteLinkComponent onPasteLink={noop} />}
  />
)

export const PasteALink = () => (
  <Screen
    title='Paste a link to join'
    hiddenBar='Join with invite link'
    figma='3190:10892'
    note='the WIP frame reduced to its intent: heading, one input ("Link"), Continue'
    render={() => <PasteLinkComponent heading={'Paste a link to join'} handleCommunityAction={noop} />}
  />
)

// ---------------------------------------------------------------------------
// The scanner sheets. The prototype draws one state: the camera. The requesting,
// denied and no-camera states have no frame; their copy is the implementation's
// minimum (QrScannerComponent SCANNER_COPY), not the designer's.

/**
 * One of the two, never neither: `bar` for Link devices' scanner, which keeps the frame's bar
 * title because it draws a camera and not a heading (LinkDevices.tsx TITLED_STEPS.scan), and
 * `droppedBar` for Join community's, whose modal drops every bar title (JoinCommunity.tsx).
 */
type ScannerBar = { bar: string; droppedBar?: never } | { droppedBar: string; bar?: never }

const ScannerScreen: React.FC<
  {
    title: string
    figma: string
    note: string
    intro?: string
    camera: StoryCamera
  } & ScannerBar
> = ({ title, bar, droppedBar, figma, note, intro, camera }) => {
  const [decoded, setDecoded] = React.useState<string[]>([])
  const record = (entry: string) => setDecoded(list => [...list, entry])
  return (
    <WithCamera camera={camera}>
      <Screen
        title={title}
        bar={bar}
        droppedBar={droppedBar}
        figma={figma}
        note={note}
        render={() => (
          <QrScannerComponent
            intro={intro}
            onDecoded={data => record(describeInvitation(data))}
            onUsePasteLink={() => record('→ Paste a link to join (the paste step)')}
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
    droppedBar='Join with QR code'
    figma='2811:2460'
    note='scanning; the camera is a canvas stream with no code in view'
    camera={{ kind: 'blank' }}
  />
)

export const JoinWithQrCodeRequesting = () => (
  <ScannerScreen
    title='Join with QR code · requesting camera access'
    droppedBar='Join with QR code'
    figma='2811:2460'
    note='no frame in the prototype for this state; getUserMedia never settles here'
    camera={{ kind: 'pending' }}
  />
)

export const JoinWithQrCodeDecoded = () => (
  <ScannerScreen
    title='Join with QR code · decoded'
    droppedBar='Join with QR code'
    figma='2811:2460'
    note='the camera shows a QR code of the sample member link; the decoded link is dispatched below and the camera released'
    camera={{ kind: 'code', text: SAMPLE_MEMBER_LINK }}
  />
)

export const JoinWithQrCodeInvalid = () => (
  <ScannerScreen
    title='Join with QR code · not an invitation'
    droppedBar='Join with QR code'
    figma='2811:2460'
    note="the camera shows a QR code of https://example.com/: the paste field's error, scanning continues"
    camera={{ kind: 'code', text: 'https://example.com/' }}
  />
)

export const JoinWithQrCodeDenied = () => (
  <ScannerScreen
    title='Join with QR code · camera denied'
    droppedBar='Join with QR code'
    figma='2811:2460'
    note='no frame in the prototype for this state; the copy is the minimum, "Paste a link" routes to the paste step'
    camera={{ kind: 'denied' }}
  />
)

export const JoinWithQrCodeNoCamera = () => (
  <ScannerScreen
    title='Join with QR code · no camera'
    droppedBar='Join with QR code'
    figma='2811:2460'
    note='no frame in the prototype for this state; the copy is the minimum, "Paste a link" routes to the paste step'
    camera={{ kind: 'none' }}
  />
)

export const CreateCommunity = () => (
  <Screen
    title='Create a community'
    hiddenBar='Create a community'
    figma='2811:2451'
    note='community icon upload is phase 2'
    render={() => <CreateCommunityComponent handleCommunityAction={noop} />}
  />
)

// The devices the list draws in these stories. `isCurrent` is the device being read
// from and is never a row; a removed device is gone even though the graph still has it.
const EXAMPLE_LINKED_DEVICES: LinkedDevice[] = [
  { deviceId: 'this', deviceName: 'this device', isCurrent: true },
  { deviceId: 'laptop', deviceName: 'nyc-laptop', isCurrent: false },
  { deviceId: 'phone', deviceName: 'work-phone', isCurrent: false },
]

// ---------------------------------------------------------------------------
// Link devices. Which rows are drawn follows the direction (LinkDevices.tsx): inside
// a community this device shares (Display QR code, Copy link), without one it receives
// (Scan QR code, Paste link). Both are below, because both are entries a person meets.

/** The rows follow the direction (user decision, 2026-09-13); the link-glyph rows' labels are undesigned. */
const LINK_DEVICES_NOTE =
  "rows in the bordered group per 2811:2575 and the Device-linking desktop frames (3RcrYKRTiFY87TpFSqZyj4 879:20987 / 880:17196); the Paste link row is a user addition (2026-09-13) with the library link glyph, its label undesigned; the frames' Linked devices list is drawn on the share direction (TryQuiet/quiet#3636), which is the one with a community and so a team graph to read the devices from, and it stays silent until that read lands; the frames' trash glyph is still absent (no device removal yet)"

export const LinkDevices = () => (
  <Screen
    title='Link devices · in a community (share)'
    droppedBar='Link devices'
    figma='2811:2575'
    note={`${LINK_DEVICES_NOTE}; inside a community this device shares: Display QR code and Copy link (the same link the QR sheet shows), the receive rows are not drawn`}
    render={() => (
      <LinkDevicesComponent
        direction='share'
        onDisplayQrCode={noop}
        deviceLink={SAMPLE_DEVICE_LINK}
        onLinkCopied={noop}
        linkedDevices={EXAMPLE_LINKED_DEVICES}
      />
    )}
  />
)

export const LinkDevicesNothingLinked = () => (
  <Screen
    title='Link devices · in a community, nothing linked yet'
    droppedBar='Link devices'
    figma='2811:2575'
    note={`${LINK_DEVICES_NOTE}; the read came back with no other device, so the card says so`}
    render={() => (
      <LinkDevicesComponent
        direction='share'
        onDisplayQrCode={noop}
        deviceLink={SAMPLE_DEVICE_LINK}
        onLinkCopied={noop}
        linkedDevices={[]}
      />
    )}
  />
)

export const LinkDevicesDeviceListUnread = () => (
  <Screen
    title='Link devices · device list not read yet'
    droppedBar='Link devices'
    figma='2811:2575'
    note={`${LINK_DEVICES_NOTE}; between opening the surface and the backend answering there is no card at all, because "No linked devices" would be a guess until the read lands`}
    render={() => (
      <LinkDevicesComponent
        direction='share'
        onDisplayQrCode={noop}
        deviceLink={SAMPLE_DEVICE_LINK}
        onLinkCopied={noop}
      />
    )}
  />
)

export const LinkDevicesEmpty = () => (
  <Screen
    title='Link devices · no community (receive)'
    droppedBar='Link devices'
    figma='2811:2575'
    note={`${LINK_DEVICES_NOTE}; without a community this device receives: Scan QR code and Paste link, the share rows are not drawn`}
    render={() => <LinkDevicesComponent direction='receive' onScanQrCode={noop} onPasteLink={noop} />}
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
    droppedBar='Link devices'
    figma='—'
    note={PASTE_LINK_NOTE}
    render={() => (
      <PasteLinkComponent heading={'Paste a link to join'} linkKind='device' handleCommunityAction={noop} />
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
      droppedBar='Link devices'
      figma='—'
      note={`${PASTE_LINK_NOTE}; the sample member link was pasted and submitted — the error copy is undesigned`}
      render={() => (
        <PasteLinkComponent
          heading={'Paste a link to join'}
          linkKind='device'
          revealInputValue
          handleCommunityAction={noop}
        />
      )}
    />
  </SubmitOnMount>
)

// The QR code sheet. Unlike the stages above it draws no heading of its own, and it is
// a sheet with a close glyph, so it is the one Link devices step that keeps a bar title
// (LinkDevices.tsx TITLED_STEPS.display).
const QR_CODE_NOTE =
  'the QR in the qr-code-box (220, 1px #B3B3B3 r4, 188 code), the sheet’s sentence and Reset QR code per 2811:2601 / desktop 880:17427; Copy link (user decision 2026-09-13) sits in the slot the Add members QR sheet 2932:3707 gives its primary button — the raw link is never shown; develop’s security paragraph is below it; "Link copied" and the generating (ActionProgress, #3518) / unavailable states have no frame'

export const DisplayQrCode = () => (
  <Screen
    title='Display QR code'
    bar='QR code'
    left='close'
    figma='2811:2601'
    note={QR_CODE_NOTE}
    render={() => (
      <DisplayQrCodeComponent
        deviceLink={SAMPLE_DEVICE_LINK}
        isLoading={false}
        onReset={noop}
        dataTestId='link-devices-display'
      />
    )}
  />
)

export const DisplayQrCodeGenerating = () => (
  <Screen
    title='Display QR code · generating the link'
    bar='QR code'
    left='close'
    figma='2811:2601'
    note='no frame for this state: while the backend mints the link the box is empty and the actions give way to the library progress bar (ActionProgress, #3518) with “Generating device link…” as its status line'
    render={() => <DisplayQrCodeComponent deviceLink={''} isLoading onReset={noop} dataTestId='link-devices-display' />}
  />
)

export const DisplayQrCodeUnavailable = () => (
  <Screen
    title='Display QR code · no community'
    bar='QR code'
    left='close'
    figma='2811:2601'
    note='no frame for this state: without a community no link can be minted; there is nothing to act on, so no action is drawn. Reached only from Settings → Linked devices — Link devices itself shows the receive rows without a community'
    render={() => (
      <DisplayQrCodeComponent deviceLink={''} isLoading={false} onReset={noop} dataTestId='link-devices-display' />
    )}
  />
)

export const SettingsLinkedDevices = () => (
  <Screen
    title='Settings · Linked devices (in app)'
    droppedBar='Linked devices'
    figma='879:19861'
    note='the in-app entry (the Device-linking file’s Entry points board): the Settings tab shows the same Link devices content, and each row opens the Link devices modal at its step. The panel prints its own heading, so the settings bar drops the row’s title (SettingsComponent titleInPanel). The frame’s device list ships here (TryQuiet/quiet#3636): Settings is only reachable inside a community, so this tab always has a team graph to read the devices from. Drawn here in the onboarding shell; the real tab sits beside the settings list'
    render={() => (
      <LinkDevicesComponent
        direction='share'
        onDisplayQrCode={noop}
        deviceLink={SAMPLE_DEVICE_LINK}
        onLinkCopied={noop}
        linkedDevices={EXAMPLE_LINKED_DEVICES}
      />
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
    note='the camera shows a QR code of the sample device link; the camera is released and the consent sheet is raised — linkDevice follows only once it is confirmed'
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
    hiddenBar='Create a community'
    left='close'
    figma='2811:2371'
    note="the prototype's copy; the library's Register username is stale"
    render={() => <CreateUsernameBody registerUsername={noop} />}
  />
)

// Join with invite link as the app wires it: the link itself is the path.
// Opening it hands Electron a quiet:// URL; customProtocol.saga.ts dispatches
// joinCommunity({ inviteData }) and opens Choose username on top of the join
// modal, which keeps its step underneath. Paste a link is the fallback.
const INVITE_LINK_PATH: { label: string; bar: string; then: string; render: () => React.ReactNode }[] = [
  {
    label: '1 · Join community',
    bar: 'no bar title (the frame hides “Quiet”)',
    then: 'Join with invite link →',
    render: () => (
      <JoinCommunityOptionsComponent onJoinWithInviteLink={noop} onJoinWithQrCode={noop} onRecoverAccount={noop} />
    ),
  },
  {
    label: '2 · Open invite link',
    bar: 'no bar title (the frame hides “Join with invite link”)',
    then: 'the user opens the link: quiet://… → customProtocol.saga.ts → joinCommunity({ inviteData }) →',
    render: () => <OpenInviteLinkComponent onPasteLink={noop} />,
  },
  {
    label: '3 · Choose username',
    bar: 'no bar title (the frame hides “Create a community”)',
    then: 'registerUsername({ nickname }); close returns to step 2, the screen the link arrived on',
    render: () => <CreateUsernameBody registerUsername={noop} />,
  },
]

export const InviteLinkPath = () => (
  <StyledEngineProvider injectFirst>
    <ThemeProvider theme={lightTheme}>
      <div style={{ padding: 24, fontFamily: "'Rubik', sans-serif", color: '#171B12' }}>
        <h1 style={{ fontSize: 26, lineHeight: '34px', fontWeight: 500, margin: '0 0 4px', letterSpacing: '-0.02em' }}>
          Join with invite link · the wired path
        </h1>
        <p style={{ fontSize: 13, lineHeight: '19px', color: INK_3, margin: '0 0 16px' }}>
          Figma <span style={{ fontFamily: mono }}>2811:2562 → 2811:2455 → 2811:2371</span> · the link is the path:
          opening it hands the app a quiet:// URL and customProtocol.saga.ts joins and asks for a username on top of the
          join modal · Paste a link is the fallback (Paste a link to join, above)
        </p>
        <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start', overflowX: 'auto', paddingBottom: 8 }}>
          {INVITE_LINK_PATH.map(step => (
            <Column key={step.label} width={CONTENT_COLUMN_WIDTH} label={`${step.label} · ${step.bar}`}>
              {step.render()}
              <div
                style={{
                  fontFamily: mono,
                  fontSize: 11,
                  lineHeight: '16px',
                  color: INK_3,
                  padding: '8px 12px',
                  borderTop: `1px solid ${RULE}`,
                }}
              >
                {step.then}
              </div>
            </Column>
          ))}
        </div>
      </div>
    </ThemeProvider>
  </StyledEngineProvider>
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
  | 'recoverAccount'
  | 'openInviteLink'
  | 'pasteALink'
  | 'joinWithQrCode'
  | 'pasteFromQrCode'
  | 'createCommunity'
  | 'chooseUsername'
  | 'linkDevices'
  | 'displayQrCode'
  | 'scanQrCode'
  | 'pasteFromScan'
  | 'pasteLink'

const STEPS: Record<Step, { title: string; bar?: string; hiddenBar?: string; droppedBar?: string; left: ShellLeft }> = {
  getStarted: { title: 'Get started', left: 'none' },
  joinCommunity: { title: 'Join community', hiddenBar: 'Quiet', left: 'back' },
  recoverAccount: { title: 'Recover account', hiddenBar: 'Account recovery', left: 'back' },
  openInviteLink: { title: 'Open invite link', hiddenBar: 'Join with invite link', left: 'back' },
  pasteALink: { title: 'Paste a link to join', hiddenBar: 'Join with invite link', left: 'back' },
  joinWithQrCode: { title: 'Join with QR code', droppedBar: 'Join with QR code', left: 'back' },
  pasteFromQrCode: { title: 'Paste a link to join', droppedBar: 'Join with QR code', left: 'back' },
  createCommunity: { title: 'Create a community', hiddenBar: 'Create a community', left: 'back' },
  chooseUsername: { title: 'Choose username', hiddenBar: 'Create a community', left: 'close' },
  linkDevices: { title: 'Link devices', droppedBar: 'Link devices', left: 'back' },
  // The two sheets keep the bar title their frames give them: neither draws a heading
  // of its own, so nothing would repeat it (LinkDevices.tsx TITLED_STEPS).
  displayQrCode: { title: 'Display QR code', bar: 'QR code', left: 'close' },
  scanQrCode: { title: 'Scan QR code', bar: 'Scan QR code', left: 'back' },
  pasteFromScan: { title: 'Paste a link to join', droppedBar: 'Link devices', left: 'back' },
  pasteLink: { title: 'Paste link', droppedBar: 'Link devices', left: 'back' },
}

const PASTE_STEPS: Step[] = ['pasteALink', 'pasteFromQrCode', 'pasteFromScan', 'pasteLink']

/** What the walkthrough's camera shows; `code` is the sample link the step it is on expects. */
type WalkthroughCamera = 'code' | 'blank' | 'denied' | 'none'
const WALKTHROUGH_CAMERAS: WalkthroughCamera[] = ['code', 'blank', 'denied', 'none']

const SAMPLE_MEMBER_LINK = composeInvitationShareUrl({ ...validInvitationDatav4[0], kind: InvitationKind.Member })
/** What the OS hands the app when the same invitation is opened as a link (quiet://). */
const SAMPLE_MEMBER_DEEP_LINK = composeInvitationDeepUrl({ ...validInvitationDatav4[0], kind: InvitationKind.Member })
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

/** Type a value into every paste input under `root` the way a user would (React sees a native input event). */
const fillPasteInputs = (root: HTMLElement | null, value: string) => {
  if (!root) return
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
  root.querySelectorAll<HTMLInputElement>('input[data-testid="paste-link-input"]').forEach(input => {
    setter?.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

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
  const [cameraMode, setCameraMode] = React.useState<WalkthroughCamera>('code')
  // LinkDevices.tsx picks its direction from `currentCommunity`. The walkthrough starts at
  // Get started, which only shows without one, so it starts on the receive side.
  const [inCommunity, setInCommunity] = React.useState(false)
  const rootRef = React.useRef<HTMLDivElement>(null)
  /**
   * The app has one camera; this story draws the step twice, so both columns' scanners decode
   * the same code and would each hand it over. The first one through wins and the log records
   * what the app would dispatch — once. Navigating clears it, so the next screen starts fresh.
   */
  const handled = React.useRef(false)

  // The story camera follows the step: Join with QR code sees the sample member link,
  // Scan QR code the sample device link.
  const camera: StoryCamera =
    cameraMode === 'code'
      ? { kind: 'code', text: step === 'scanQrCode' ? SAMPLE_DEVICE_LINK : SAMPLE_MEMBER_LINK }
      : { kind: cameraMode }

  const go = (next: Step) => {
    handled.current = false
    setTrail([...trail, step])
    setStep(next)
  }
  const back = () => {
    const prev = trail[trail.length - 1]
    if (!prev) return
    handled.current = false
    setTrail(trail.slice(0, -1))
    setStep(prev)
  }
  const record = (action: string) => setDispatched(d => [...d, action])
  /** The container closes its modal and the joining panel takes over; the story returns to the entry screen. */
  const finish = () => {
    handled.current = false
    setTrail([])
    setStep('getStarted')
  }
  const restart = () => {
    finish()
    setDispatched([])
  }

  // JoinCommunity.tsx / LinkDevices.tsx: a member link joins and asks for a username; a device
  // link does not link on arrival — scanned or pasted, it raises the consent sheet first, and
  // only confirming it dispatches. The sheet is named here rather than drawn.
  const onInvitation = (data: InvitationData) => {
    if (handled.current) return
    if (isDeviceInvitationData(data)) {
      record('device-link consent, then communities.actions.linkDevice({ inviteData, deviceLinkConsent: true })')
      finish()
    } else {
      record('communities.actions.joinCommunity({ inviteData })')
      go('chooseUsername')
    }
    // Last: go() and finish() clear the flag for the screen being opened, and this decode is done.
    handled.current = true
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
  // Opened from Account recovery, LinkDevices.tsx's back arrow returns there (here the trail does
  // the same).
  const openLinkDevices = () => {
    go('linkDevices')
  }
  // customProtocol.saga.ts: an invite link opened while Join with invite link shows joins and asks for a username.
  const openDeepLink = () => {
    record(
      `communities.actions.customProtocol(['${SAMPLE_MEMBER_DEEP_LINK.slice(0, 24)}…']) → joinCommunity({ inviteData })`
    )
    go('chooseUsername')
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
            onRecoverAccount={() => go('recoverAccount')}
          />
        )
      case 'recoverAccount':
        return (
          <RecoverAccountComponent onUseLinkedDevice={openLinkDevices} onUseInviteLink={() => go('openInviteLink')} />
        )
      case 'openInviteLink':
        return <OpenInviteLinkComponent onPasteLink={() => go('pasteALink')} />
      case 'pasteALink':
        return <PasteLinkComponent heading={'Paste a link to join'} handleCommunityAction={onInvitation} />
      // Keyed on the camera: the scanner asks for it once, on mount, so switching the mode
      // while looking at this step has to re-open it or the button would do nothing.
      case 'joinWithQrCode':
        return (
          <QrScannerComponent key={cameraMode} onDecoded={onInvitation} onUsePasteLink={() => go('pasteFromQrCode')} />
        )
      case 'pasteFromQrCode':
        return <PasteLinkComponent heading={'Paste a link to join'} handleCommunityAction={onInvitation} />
      case 'createCommunity':
        return <CreateCommunityComponent handleCommunityAction={onCreate} />
      case 'chooseUsername':
        return <CreateUsernameBody registerUsername={onRegister} />
      case 'linkDevices':
        return (
          <LinkDevicesComponent
            direction={inCommunity ? 'share' : 'receive'}
            onDisplayQrCode={() => go('displayQrCode')}
            deviceLink={SAMPLE_DEVICE_LINK}
            onLinkCopied={() => record('the device link is on the clipboard · “Copied”')}
            onScanQrCode={() => go('scanQrCode')}
            onPasteLink={() => go('pasteLink')}
          />
        )
      case 'displayQrCode':
        return (
          <DisplayQrCodeComponent
            deviceLink={SAMPLE_DEVICE_LINK}
            isLoading={false}
            onReset={noop}
            dataTestId='link-devices-display'
          />
        )
      case 'scanQrCode':
        return (
          <QrScannerComponent
            key={cameraMode}
            intro={SCAN_QR_INTRO}
            onDecoded={onInvitation}
            onUsePasteLink={() => go('pasteFromScan')}
            dataTestId='link-devices-scanner'
          />
        )
      // Both paste fields under Link devices take device links only (LinkDevices.tsx linkKind).
      case 'pasteFromScan':
      case 'pasteLink':
        return (
          <PasteLinkComponent heading={'Paste a link to join'} linkKind='device' handleCommunityAction={onInvitation} />
        )
    }
  }

  const { title, bar, hiddenBar, droppedBar, left } = STEPS[step]
  const isPasteStep = PASTE_STEPS.includes(step)
  // Choose username's close leaves onboarding (the story restarts); the QR sheet's close
  // returns to Link devices, as LinkDevices.tsx does when the sheet is not the initial step.
  const onLeft = left === 'none' ? undefined : left === 'close' && step === 'chooseUsername' ? restart : back

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
              {barCaption(bar, hiddenBar, droppedBar)} · rows, buttons and the back arrow navigate; where the app
              dispatches, the action is recorded below · trail:{' '}
              <span style={{ fontFamily: mono }} data-testid='walkthrough-trail'>
                {[...trail, step].map(s => STEPS[s].title).join(' › ')}
              </span>
            </p>
            <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start', overflowX: 'auto', paddingBottom: 8 }}>
              <Column width={SHELL_WIDTH} label='desktop · modal full-window shell (715) · 375 column centered'>
                <Shell
                  title={bar}
                  withoutTitle={hiddenBar !== undefined || droppedBar !== undefined}
                  left={left}
                  onLeft={onLeft}
                >
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
              {step === 'linkDevices' && (
                <button
                  type='button'
                  style={chromeButton}
                  onClick={() => setInCommunity(value => !value)}
                  data-testid='walkthrough-link-devices-direction'
                >
                  {inCommunity ? 'in a community (share)' : 'no community (receive)'}
                </button>
              )}
              {step === 'openInviteLink' && (
                <button
                  type='button'
                  style={chromeButton}
                  onClick={openDeepLink}
                  data-testid='walkthrough-open-deep-link'
                >
                  open the sample invite link (quiet:// deep link)
                </button>
              )}
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
