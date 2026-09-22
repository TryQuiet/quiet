import React from 'react'
import '@testing-library/jest-dom/extend-expect'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { composeInvitationShareUrl, validInvitationDatav4 } from '@quiet/common'
import { InvitationKind } from '@quiet/types'

import { renderComponent } from '../../testUtils/renderComponent'
import { drawQr, qrImageData } from '../../testUtils/qrImage'
import { InviteLinkErrors } from '../../forms/fieldsErrors'
import { DISPLAY_QR_CODE_COPY } from '../../components/Onboarding/DisplayQrCodeComponent'
import { SCANNER_COPY } from '../../components/Onboarding/qrScanner/QrScannerComponent'

import {
  DisplayQrCode,
  DisplayQrCodeGenerating,
  DisplayQrCodeUnavailable,
  LinkDevices,
  LinkDevicesDeviceListUnread,
  LinkDevicesEmpty,
  LinkDevicesNothingLinked,
  PasteLinkNotADeviceLink,
  PasteLinkOnLinkDevices,
  SettingsLinkedDevices,
  Walkthrough,
} from './OnboardingScreens.stories'

/**
 * `storyCamera.ts` paints the code with this, so spying on it records the exact text the
 * story chose to put in front of the camera — which is how the step-dependent choice
 * (a device link on Scan QR code, a member link on Join with QR code) is checked.
 */
jest.mock('../../testUtils/qrImage', () => {
  const actual = jest.requireActual('../../testUtils/qrImage')
  return { ...actual, drawQr: jest.fn(actual.drawQr) }
})
const paintedQr = drawQr as jest.MockedFunction<typeof drawQr>
/** Every text the story camera has painted since the story mounted. */
const painted = () => paintedQr.mock.calls.map(call => call[1])

/**
 * These stories are the design library's record of what the onboarding screens look like,
 * so what they are worth is that they draw what the app draws. The two things this file
 * pins are the two the merge train dropped and this change restores: the Link devices
 * stories (both directions, the paste step, the three QR-sheet states and the in-app
 * entry) and the walkthrough's camera.
 *
 * Every story renders its screen twice — the 715 modal shell and the bare 375 column — so
 * everything is queried with `getAllBy*` and read from the first (shell) copy.
 */

const memberData = { ...validInvitationDatav4[0], kind: InvitationKind.Member as const }
const memberLink = composeInvitationShareUrl(memberData)
const deviceData = {
  ...validInvitationDatav4[0],
  kind: InvitationKind.Device as const,
  authData: {
    ...validInvitationDatav4[0].authData,
    userId: 'q5ck86uuhihx5w00zhknit60',
    userName: 'Alice device owner',
  },
}
const deviceLink = composeInvitationShareUrl(deviceData)

/** Decoding a frame under a loaded box can outlast waitFor's 1 s default. */
const DECODE_TIMEOUT = { timeout: 5000 }

/** What the shell's bar prints; '' is the bar zone with the glyph and no title. */
const barTitle = () => screen.getAllByTestId('shell-title')[0].textContent
const firstRows = () => screen.getAllByTestId('link-devices-rows')[0]

/**
 * jsdom has neither a canvas nor `captureStream`, which the stories' own camera
 * (`storyCamera.ts`) uses to hand the scanner a painted QR code. This supplies both: painting
 * goes nowhere and every 2D context reads back `frame`, a real QR image of a real link made by
 * the app's own encoder — so the scanner runs its real video → canvas → jsQR pipeline and the
 * decoded link is genuinely decoded.
 *
 * What it does NOT stand in for: because painting goes nowhere, the frame the scanner reads is
 * the one injected here, not the one the story painted. Which link the story chose is checked
 * separately, through the `drawQr` spy above. The `denied` and `none` camera modes never reach
 * a canvas at all; they are the story camera's own rejections, unmocked.
 */
const installJsdomCanvas = (frame?: ImageData) => {
  const context = {
    fillStyle: '',
    fillRect: jest.fn(),
    drawImage: jest.fn(),
    getImageData: jest.fn(
      () => frame ?? ({ data: new Uint8ClampedArray(4 * 4 * 4).fill(255), width: 4, height: 4 } as ImageData)
    ),
  }
  /**
   * A real track reports 'ended' once stopped, and storyCamera's repaint interval watches for
   * exactly that to clear itself — so the stub has to end too, or the story keeps painting
   * into a released camera for the rest of the suite.
   */
  const track: { readyState: MediaStreamTrackState; stop: jest.Mock } = {
    readyState: 'live',
    stop: jest.fn(() => {
      track.readyState = 'ended'
    }),
  }
  const stream = { getTracks: () => [track], getVideoTracks: () => [track] }

  const mediaDevices = Object.getOwnPropertyDescriptor(navigator, 'mediaDevices')
  const readyState = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'readyState')
  const videoWidth = Object.getOwnPropertyDescriptor(HTMLVideoElement.prototype, 'videoWidth')
  const videoHeight = Object.getOwnPropertyDescriptor(HTMLVideoElement.prototype, 'videoHeight')
  const play = HTMLMediaElement.prototype.play
  const getContext = HTMLCanvasElement.prototype.getContext
  const canvas = HTMLCanvasElement.prototype as unknown as { captureStream?: () => unknown }
  const captureStream = canvas.captureStream

  Object.defineProperty(HTMLMediaElement.prototype, 'readyState', { get: () => 4, configurable: true })
  Object.defineProperty(HTMLVideoElement.prototype, 'videoWidth', {
    get: () => frame?.width ?? 640,
    configurable: true,
  })
  Object.defineProperty(HTMLVideoElement.prototype, 'videoHeight', {
    get: () => frame?.height ?? 480,
    configurable: true,
  })
  HTMLMediaElement.prototype.play = jest.fn().mockResolvedValue(undefined)
  HTMLCanvasElement.prototype.getContext = jest.fn(() => context) as unknown as typeof getContext
  canvas.captureStream = () => stream

  return {
    track,
    restore: () => {
      if (mediaDevices) Object.defineProperty(navigator, 'mediaDevices', mediaDevices)
      else delete (navigator as { mediaDevices?: unknown }).mediaDevices
      if (readyState) Object.defineProperty(HTMLMediaElement.prototype, 'readyState', readyState)
      if (videoWidth) Object.defineProperty(HTMLVideoElement.prototype, 'videoWidth', videoWidth)
      if (videoHeight) Object.defineProperty(HTMLVideoElement.prototype, 'videoHeight', videoHeight)
      HTMLMediaElement.prototype.play = play
      HTMLCanvasElement.prototype.getContext = getContext
      if (captureStream) canvas.captureStream = captureStream
      else delete canvas.captureStream
    },
  }
}

let canvasStub: ReturnType<typeof installJsdomCanvas> | undefined

afterEach(() => {
  canvasStub?.restore()
  canvasStub = undefined
  paintedQr.mockClear()
})

describe('Screens/Onboarding — the Link devices stories', () => {
  it('draws the share direction inside a community: Display QR code and Copy link, and no receive rows', () => {
    renderComponent(<LinkDevices />)

    const rows = firstRows()
    expect(within(rows).getByTestId('link-devices-display-qr')).toBeVisible()
    expect(within(rows).getByTestId('link-devices-copy-link')).toBeVisible()
    expect(within(rows).queryByTestId('link-devices-scan-qr')).not.toBeInTheDocument()
    expect(within(rows).queryByTestId('link-devices-paste-link')).not.toBeInTheDocument()
    // The screen carries its own "Link devices" heading, so the frame's bar title is dropped.
    expect(screen.getAllByRole('heading', { name: 'Link devices', level: 3 })[0]).toBeVisible()
    expect(barTitle()).toBe('')
  })

  it('draws the receive direction without a community: Scan QR code and Paste link, and no share rows', () => {
    renderComponent(<LinkDevicesEmpty />)

    const rows = firstRows()
    expect(within(rows).getByTestId('link-devices-scan-qr')).toBeVisible()
    expect(within(rows).getByTestId('link-devices-paste-link')).toBeVisible()
    expect(within(rows).queryByTestId('link-devices-display-qr')).not.toBeInTheDocument()
    expect(within(rows).queryByTestId('link-devices-copy-link')).not.toBeInTheDocument()
    expect(barTitle()).toBe('')
  })

  it('draws the device list on the share direction and never on receive', () => {
    const { unmount } = renderComponent(<LinkDevices />)
    expect(screen.getAllByTestId('linked-devices-list')[0]).toBeVisible()
    expect(screen.getAllByTestId('linked-device-laptop')[0]).toHaveTextContent('nyc-laptop')
    // The device being read from is never a row.
    expect(screen.queryByTestId('linked-device-this')).not.toBeInTheDocument()
    unmount()

    // Receiving, there is no community and so no team graph to list devices from.
    renderComponent(<LinkDevicesEmpty />)
    expect(screen.queryByTestId('linked-devices-list')).not.toBeInTheDocument()
    expect(screen.queryByTestId('no-linked-devices')).not.toBeInTheDocument()
  })

  it('says "No linked devices" when the read came back with none, and nothing before it lands', () => {
    const { unmount } = renderComponent(<LinkDevicesNothingLinked />)
    expect(screen.getAllByTestId('no-linked-devices')[0]).toHaveTextContent('No linked devices')
    unmount()

    renderComponent(<LinkDevicesDeviceListUnread />)
    expect(screen.queryByTestId('linked-devices-list')).not.toBeInTheDocument()
    expect(screen.queryByTestId('no-linked-devices')).not.toBeInTheDocument()
  })

  it('draws the Paste link step as the paste field under its own heading', () => {
    renderComponent(<PasteLinkOnLinkDevices />)

    expect(screen.getAllByRole('heading', { name: 'Paste a link to join', level: 3 })[0]).toBeVisible()
    expect(screen.getAllByTestId('paste-link-input')[0]).toBeVisible()
    expect(barTitle()).toBe('')
  })

  it('refuses a member link on the Paste link step, with the undesigned error', async () => {
    renderComponent(<PasteLinkNotADeviceLink />)

    // The story pastes the sample member link and submits, so the error is the real one.
    expect(await screen.findAllByText(InviteLinkErrors.NotDeviceLink)).not.toHaveLength(0)
    expect(screen.getAllByTestId('paste-link-input')[0]).toHaveValue(memberLink)
  })

  it('draws the QR code sheet with the code, the sheet sentence and the security copy, and keeps its bar title', () => {
    renderComponent(<DisplayQrCode />)

    expect(screen.getAllByTestId('link-devices-display-box')[0]).toBeVisible()
    expect(screen.getAllByText(DISPLAY_QR_CODE_COPY.scan)[0]).toBeVisible()
    expect(screen.getAllByTestId('link-devices-display-security')[0]).toHaveTextContent(DISPLAY_QR_CODE_COPY.security)
    expect(screen.getAllByText(DISPLAY_QR_CODE_COPY.copyLink)[0]).toBeVisible()
    expect(screen.getAllByText(DISPLAY_QR_CODE_COPY.reset)[0]).toBeVisible()
    // The sheet draws no heading of its own, so it is the one Link devices step that keeps
    // the frame's bar title — and it closes rather than going back.
    expect(barTitle()).toBe('QR code')
    expect(screen.getAllByTestId('shell-close')[0]).toBeVisible()
  })

  it('draws the generating state as the progress bar with its status line, and no action', () => {
    renderComponent(<DisplayQrCodeGenerating />)

    expect(screen.getAllByTestId('link-devices-display-progress')[0]).toBeVisible()
    expect(screen.getAllByText(DISPLAY_QR_CODE_COPY.generating)[0]).toBeVisible()
    expect(screen.queryByText(DISPLAY_QR_CODE_COPY.copyLink)).not.toBeInTheDocument()
    expect(screen.queryByText(DISPLAY_QR_CODE_COPY.unavailable)).not.toBeInTheDocument()
    expect(barTitle()).toBe('QR code')
  })

  it('draws the unavailable state in the box, with nothing to act on', () => {
    renderComponent(<DisplayQrCodeUnavailable />)

    expect(screen.getAllByTestId('link-devices-display-status')[0]).toHaveTextContent(DISPLAY_QR_CODE_COPY.unavailable)
    expect(screen.queryByText(DISPLAY_QR_CODE_COPY.copyLink)).not.toBeInTheDocument()
    expect(screen.queryByTestId('link-devices-display-progress')).not.toBeInTheDocument()
    expect(barTitle()).toBe('QR code')
  })

  it('draws the in-app Settings entry as the same share content, with the row title dropped from the bar', () => {
    renderComponent(<SettingsLinkedDevices />)

    const rows = firstRows()
    expect(within(rows).getByTestId('link-devices-display-qr')).toBeVisible()
    expect(within(rows).getByTestId('link-devices-copy-link')).toBeVisible()
    // SettingsComponent gives Linked devices `titleInPanel`, so the panel's heading is the title.
    expect(barTitle()).toBe('')
    expect(screen.getAllByRole('heading', { name: 'Link devices', level: 3 })[0]).toBeVisible()
  })
})

describe('Screens/Onboarding — the walkthrough camera', () => {
  /** Walk the walkthrough by clicking the first (shell) copy of each control. */
  const click = async (user: ReturnType<typeof userEvent.setup>, testId: string) =>
    user.click(screen.getAllByTestId(testId)[0])
  const trail = () => screen.getAllByTestId('walkthrough-trail')[0].textContent
  const dispatched = () => screen.getAllByTestId('walkthrough-dispatched')[0].textContent
  /** How many actions the log holds, which is how many the app would have dispatched. */
  const dispatchCount = () =>
    Number(/dispatched \((\d+)\)/.exec(screen.getAllByTestId('walkthrough-dispatched')[0].textContent ?? '')?.[1])

  it('opens the real camera on Join with QR code, and a decoded member link joins', async () => {
    canvasStub = installJsdomCanvas(qrImageData(memberLink))
    const user = userEvent.setup()
    renderComponent(<Walkthrough />)

    await click(user, 'get-started-join')
    await click(user, 'join-with-qr-code')

    // The step is the scanner, not the paste stand-in it was left as.
    expect(screen.getAllByTestId('qr-scanner-viewfinder')[0]).toBeVisible()
    expect(screen.queryByTestId('paste-link-input')).not.toBeInTheDocument()
    expect(trail()).toContain('Join with QR code')

    await waitFor(
      () => expect(dispatched()).toContain('communities.actions.joinCommunity({ inviteData })'),
      DECODE_TIMEOUT
    )
    expect(trail()).toContain('Choose username')

    // Both columns draw a camera and both decode the same code, but the app has one: the log
    // records the join once. Left ungated this is 2, which is what it was.
    expect(dispatchCount()).toBe(1)
    // The story put the member link in front of the camera, not the device one.
    expect(painted()).toContain(memberLink)
    expect(painted()).not.toContain(deviceLink)
    // Accepting a code releases the camera, and the released track reports itself ended.
    expect(canvasStub?.track.stop).toHaveBeenCalled()
    expect(canvasStub?.track.readyState).toBe('ended')
  })

  it('lets the camera buttons deny the camera and take it away, and back', async () => {
    canvasStub = installJsdomCanvas(qrImageData(memberLink))
    const user = userEvent.setup()
    renderComponent(<Walkthrough />)

    await click(user, 'walkthrough-camera-denied')
    await click(user, 'get-started-join')
    await click(user, 'join-with-qr-code')

    expect(await screen.findAllByText(SCANNER_COPY.denied)).not.toHaveLength(0)
    expect(dispatched()).toContain('dispatched (0)')

    await click(user, 'walkthrough-camera-none')
    expect(await screen.findAllByText(SCANNER_COPY.unavailable)).not.toHaveLength(0)

    // Back on the sample code, the same scanner decodes it.
    await click(user, 'walkthrough-camera-code')
    await waitFor(
      () => expect(dispatched()).toContain('communities.actions.joinCommunity({ inviteData })'),
      DECODE_TIMEOUT
    )
    expect(dispatchCount()).toBe(1)
    // The camera repaints on an interval, so what matters is which links were ever in front of
    // it: only the member one. denied and none never reach a canvas and paint nothing at all.
    expect([...new Set(painted())]).toEqual([memberLink])
  })

  it('offers the paste field when the camera is refused, and goes to it', async () => {
    canvasStub = installJsdomCanvas()
    const user = userEvent.setup()
    renderComponent(<Walkthrough />)

    await click(user, 'walkthrough-camera-denied')
    await click(user, 'get-started-join')
    await click(user, 'join-with-qr-code')

    await screen.findAllByTestId('qr-scanner-paste-link')
    await click(user, 'qr-scanner-paste-link')

    expect(screen.getAllByTestId('paste-link-input')[0]).toBeVisible()
    expect(trail()).toContain('Join with QR code › Paste a link to join')
  })

  it('reaches the Link devices scanner through the direction toggle, and a device link asks for consent', async () => {
    canvasStub = installJsdomCanvas(qrImageData(deviceLink))
    const user = userEvent.setup()
    renderComponent(<Walkthrough />)

    await click(user, 'get-started-link-devices')
    // Without a community Link devices receives, which is where the scanner lives.
    expect(screen.getAllByTestId('link-devices-scan-qr')[0]).toBeVisible()

    // The toggle is the story's stand-in for `currentCommunity`: the share side instead.
    await click(user, 'walkthrough-link-devices-direction')
    expect(screen.getAllByTestId('link-devices-display-qr')[0]).toBeVisible()
    expect(screen.queryByTestId('link-devices-scan-qr')).not.toBeInTheDocument()

    await click(user, 'walkthrough-link-devices-direction')
    await click(user, 'link-devices-scan-qr')

    expect(screen.getAllByTestId('link-devices-scanner-viewfinder')[0]).toBeVisible()
    // The sheet draws a camera, not a heading, so it keeps the frame's bar title.
    expect(screen.getAllByTestId('shell-title')[0]).toHaveTextContent('Scan QR code')

    // A scanned device link does not link on arrival: the consent sheet comes first.
    await waitFor(() => expect(dispatched()).toContain('device-link consent'), DECODE_TIMEOUT)
    expect(dispatched()).toContain('deviceLinkConsent: true')
    expect(dispatchCount()).toBe(1)
    // On this step the camera shows the device link, which is the step-dependent choice.
    expect(painted()).toContain(deviceLink)
    expect(painted()).not.toContain(memberLink)
    expect(canvasStub?.track.readyState).toBe('ended')
  })
})
