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
import { DisplayQrCodeComponent } from '../../components/Onboarding/DisplayQrCodeComponent'
import { QrScannerComponent } from '../../components/Onboarding/qrScanner/QrScannerComponent'

// The frames these screens are built from, for the side-by-side columns.
import linkDevicesExport from '../figma/link-devices.png'
import qrSheetExport from '../figma/sheet-2811-2601.png'
import addMembersQrExport from '../figma/add-members-qr-code.png'
import desktopLinkDevicesExport from '../figma/desktop/devicelink/desktop-link-devices.png'
import desktopLinkDevicesWithLinkedExport from '../figma/desktop/devicelink/desktop-link-devices-with-linked.png'
import desktopLinkDevicesQrExport from '../figma/desktop/devicelink/desktop-link-devices-qr.png'
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

/** The rows follow the direction (user decision, 2026-09-13); the link-glyph rows' labels are undesigned. */
const LINK_DEVICES_NOTE =
  "rows in the bordered group per 2811:2575 and the Device-linking desktop frames (3RcrYKRTiFY87TpFSqZyj4 879:20987 / 880:17196); the Paste link row is a user addition (2026-09-13) with the library link glyph, its label undesigned; the frames' Linked devices list is not drawn, because nothing on this line can enumerate a user's devices (TryQuiet/quiet#3636), nor is their trash glyph (no device removal yet)"

const LINK_DEVICES_EXPORTS = (desktop: string, desktopLabel: string): FigmaExport[] => [
  { label: 'figma · 2811:2575 (prototype, 375)', src: linkDevicesExport, width: CONTENT_COLUMN_WIDTH },
  { label: desktopLabel, src: desktop, width: SHELL_WIDTH },
]

const QR_CODE_NOTE =
  'the QR in the qr-code-box (220, 1px #B3B3B3 r4, 188 code), the sheet\u2019s sentence and Reset QR code per 2811:2601 / desktop 880:17427; Copy link (user decision 2026-09-13) sits in the slot the Add members QR sheet 2932:3707 gives its primary button — the raw link is never shown; "Link copied" and the generating (ActionProgress, #3518) / unavailable states have no frame'

const QR_CODE_EXPORTS: FigmaExport[] = [
  { label: 'figma · 2811:2601 (prototype sheet, 375)', src: qrSheetExport, width: CONTENT_COLUMN_WIDTH },
  {
    label: 'figma · 2932:3707 (Add members QR sheet: the button slot)',
    src: addMembersQrExport,
    width: CONTENT_COLUMN_WIDTH,
  },
  { label: 'figma · Device linking 880:17427 (desktop, 715)', src: desktopLinkDevicesQrExport, width: SHELL_WIDTH },
]

/** Type a value into every paste input under `root` the way a user would (React sees a native input event). */
const fillPasteInputs = (root: HTMLElement | null, value: string) => {
  if (!root) return
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
  root.querySelectorAll<HTMLInputElement>('input[data-testid="paste-link-input"]').forEach(input => {
    setter?.call(input, value)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

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
 * The Modal full-window shell as the app's Modal renders it: 60px header, back arrow (or
 * close) left, title centered. An empty `title` is a full-screen h1 stage (2811:2575,
 * 879:20987): the glyph alone, no title text and no bar divider — the h1 is the title.
 * Sheets keep their titled bar; the desktop frames (880:17427) draw it without a divider.
 */
const Shell: React.FC<{
  title: string
  left?: ShellLeft
  divider?: boolean
  onLeft?: () => void
  children: React.ReactNode
}> = ({ title, left = 'back', divider = title !== '', onLeft, children }) => (
  <div style={{ width: SHELL_WIDTH, minHeight: 560, background: '#fff' }}>
    <div
      style={{
        height: 60,
        display: 'flex',
        alignItems: 'center',
        borderBottom: divider ? `1px solid #F0F0F0` : 'none',
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

/** A Figma export drawn next to the rendered columns, at its frame's width (the PNGs are 2×). */
interface FigmaExport {
  label: string
  src: string
  width: number
}

const Screen: React.FC<{
  title: string
  bar: string
  figma: string
  left?: ShellLeft
  /** The shell's bar divider; off for the desktop sheet frames (880:17427), off by default when the bar has no title. */
  divider?: boolean
  note?: string
  exports?: FigmaExport[]
  render: () => React.ReactNode
}> = ({ title, bar, figma, left, divider, note, exports = [], render }) => (
  <StyledEngineProvider injectFirst>
    <ThemeProvider theme={lightTheme}>
      <div style={{ padding: 24, fontFamily: "'Rubik', sans-serif", color: '#171B12' }}>
        <h1 style={{ fontSize: 26, lineHeight: '34px', fontWeight: 500, margin: '0 0 4px', letterSpacing: '-0.02em' }}>
          {title}
        </h1>
        <p style={{ fontSize: 13, lineHeight: '19px', color: INK_3, margin: '0 0 16px' }}>
          Figma <span style={{ fontFamily: mono }}>{figma}</span> ·{' '}
          {bar ? <>title bar &ldquo;{bar}&rdquo;</> : 'no bar title (full-screen h1 stage)'} · desktop component under
          the app&rsquo;s light theme{note ? ` · ${note}` : ''}
        </p>
        <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start', overflowX: 'auto', paddingBottom: 8 }}>
          <Column width={SHELL_WIDTH} label='desktop · modal full-window shell (715) · 375 column centered'>
            <Shell title={bar} left={left} divider={divider}>
              {render()}
            </Shell>
          </Column>
          <Column
            width={CONTENT_COLUMN_WIDTH}
            label='the same column · 375 (prototype width; RN screen not renderable here)'
          >
            {render()}
          </Column>
          {exports.map(item => (
            <Column key={item.label} width={item.width} label={item.label}>
              <img src={item.src} alt={item.label} style={{ display: 'block', width: item.width }} />
            </Column>
          ))}
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
    title='Link devices · in a community (share)'
    bar=''
    figma='2811:2575'
    note={`${LINK_DEVICES_NOTE}; inside a community this device shares: Display QR code and Copy link (the same link the QR sheet shows), the receive rows are not drawn`}
    exports={LINK_DEVICES_EXPORTS(
      desktopLinkDevicesWithLinkedExport,
      'figma · Device linking 880:17196 (desktop, 715)'
    )}
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
    bar=''
    figma='2811:2575'
    note={`${LINK_DEVICES_NOTE}; without a community this device receives: Scan QR code and Paste link, the share rows are not drawn`}
    exports={LINK_DEVICES_EXPORTS(desktopLinkDevicesExport, 'figma · Device linking 879:20987 (desktop, 715)')}
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
    bar=''
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
      bar=''
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
    left='close'
    divider={false}
    figma='2811:2601'
    note={QR_CODE_NOTE}
    exports={QR_CODE_EXPORTS}
    render={() => <DisplayQrCodeComponent deviceLink={SAMPLE_DEVICE_LINK} isLoading={false} onReset={noop} />}
  />
)

export const DisplayQrCodeGenerating = () => (
  <Screen
    title='Display QR code · generating the link'
    bar='QR code'
    left='close'
    divider={false}
    figma='2811:2601'
    note='no frame for this state: while the backend mints the link the box carries #3400’s "Generating device link…", the actions give way to the library progress bar (ActionProgress, #3518) with the status line'
    render={() => <DisplayQrCodeComponent deviceLink={''} isLoading onReset={noop} />}
  />
)

export const DisplayQrCodeUnavailable = () => (
  <Screen
    title='Display QR code · no community'
    bar='QR code'
    left='close'
    divider={false}
    figma='2811:2601'
    note='no frame for this state: without a community no link can be minted; there is nothing to act on, so no action is drawn; the Link devices row is disabled then, so this is the Settings tab’s edge case'
    render={() => <DisplayQrCodeComponent deviceLink={''} isLoading={false} onReset={noop} />}
  />
)

export const SettingsLinkedDevices = () => (
  <Screen
    title='Settings · Linked devices (in app)'
    bar='Settings'
    left='close'
    figma='879:19861'
    note='the in-app entry (the Device-linking file’s Entry points board): the Settings tab shows the same Link devices content, Display QR code enabled; each row opens the Link devices modal at its step. The frame’s device list is absent — nothing on this line enumerates a user’s devices (TryQuiet/quiet#3636)'
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
  linkDevices: { title: 'Link devices', bar: '', left: 'back' },
  displayQrCode: { title: 'Display QR code', bar: 'QR code', left: 'close' },
  scanQrCode: { title: 'Scan QR code', bar: 'Scan QR code', left: 'back' },
  pasteFromScan: { title: 'Paste a link to Join', bar: '', left: 'back' },
  pasteLinkDevice: { title: 'Paste a link to Join', bar: '', left: 'back' },
}

const PASTE_STEPS: Step[] = ['pasteALink', 'pasteFromScan', 'pasteLinkDevice']

/** What the walkthrough's camera shows; the code is the sample link the current step expects. */
type WalkthroughCamera = 'code' | 'blank' | 'denied' | 'none'
const WALKTHROUGH_CAMERAS: WalkthroughCamera[] = ['code', 'blank', 'denied', 'none']

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
  const openLinkDevices = () => {
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
            direction='receive'
            onScanQrCode={() => go('scanQrCode')}
            onPasteLink={() => go('pasteLinkDevice')}
          />
        )
      case 'displayQrCode':
        return (
          <DisplayQrCodeComponent
            deviceLink={SAMPLE_DEVICE_LINK}
            isLoading={false}
            onReset={() => record('connection.actions.setDeviceLinkInvite(undefined) → createDeviceLink()')}
            dataTestId='link-devices-display'
          />
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
  // The QR code sheet's close returns to Link devices (LinkDevices.tsx); Choose username's close restarts.
  const onLeft = left === 'back' ? back : left === 'close' ? (step === 'displayQrCode' ? back : restart) : undefined

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
              {bar ? <>title bar &ldquo;{bar}&rdquo;</> : 'no bar title'} · rows, buttons and the back arrow navigate;
              where the app dispatches, the action is recorded below · trail:{' '}
              <span style={{ fontFamily: mono }} data-testid='walkthrough-trail'>
                {[...trail, step].map(s => STEPS[s].title).join(' › ')}
              </span>
            </p>
            <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start', overflowX: 'auto', paddingBottom: 8 }}>
              <Column width={SHELL_WIDTH} label='desktop · modal full-window shell (715) · 375 column centered'>
                <Shell title={bar} left={left} onLeft={onLeft} divider={step !== 'displayQrCode' && bar !== ''}>
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
