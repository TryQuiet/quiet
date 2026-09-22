import React from 'react'
import '@testing-library/jest-dom/extend-expect'
import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ipcRenderer } from 'electron'

import { SCAN_QR_CODE_INTRO, composeInvitationShareUrl, validInvitationDatav4 } from '@quiet/common'
import { InvitationKind } from '@quiet/types'

import { CAMERA_ACCESS_REQUEST, CAMERA_OPEN_PRIVACY_SETTINGS } from '../../../../shared/camera'
import { renderComponent } from '../../../testUtils/renderComponent'
import { qrImageData } from '../../../testUtils/qrImage'
import { cameraError, mockCamera } from '../../../testUtils/mockCamera'
import { InviteLinkErrors } from '../../../forms/fieldsErrors'
import { QrScannerComponent, SCANNER_COPY } from './QrScannerComponent'

const memberData = { ...validInvitationDatav4[0], kind: InvitationKind.Member as const }
const memberLink = composeInvitationShareUrl(memberData)

let camera: ReturnType<typeof mockCamera> | undefined

const invoke = ipcRenderer.invoke as jest.Mock

beforeEach(() => {
  invoke.mockReset().mockResolvedValue(undefined)
})

afterEach(() => {
  camera?.restore()
  camera = undefined
})

/** How many times the scanner went back to the OS for the camera permission. */
const accessRequests = () => invoke.mock.calls.filter(([channel]) => channel === CAMERA_ACCESS_REQUEST).length

/** Decoding a frame under a loaded box can outlast waitFor's 1 s default. */
const DECODE_TIMEOUT = { timeout: 5000 }

const status = () => screen.getByTestId('qr-scanner-viewfinder').getAttribute('data-status')

describe('QrScannerComponent', () => {
  it('asks for the camera, scans, and hands a decoded member link over once', async () => {
    camera = mockCamera({ frame: qrImageData(memberLink) })
    const onDecoded = jest.fn()
    const onUsePasteLink = jest.fn()

    renderComponent(<QrScannerComponent onDecoded={onDecoded} onUsePasteLink={onUsePasteLink} />)

    expect(status()).toBe('requesting')
    expect(screen.getByText(SCANNER_COPY.requesting)).toBeVisible()

    await waitFor(() => expect(onDecoded).toHaveBeenCalledWith(memberData), DECODE_TIMEOUT)
    expect(camera.getUserMedia).toHaveBeenCalledWith({ video: { facingMode: 'environment' }, audio: false })
    expect(onDecoded).toHaveBeenCalledTimes(1)
    expect(camera.stop).toHaveBeenCalled()
    // the status re-render is batched after the interval tick that accepted the code
    await waitFor(() => expect(status()).toBe('stopped'), DECODE_TIMEOUT)
    expect(onUsePasteLink).not.toHaveBeenCalled()
    expect(screen.queryByText(InviteLinkErrors.InvalidCode)).not.toBeInTheDocument()
  })

  it('shows the viewfinder frame while scanning and keeps scanning past a code that is not an invitation', async () => {
    camera = mockCamera({ frame: qrImageData('https://example.com/not-quiet') })
    const onDecoded = jest.fn()

    renderComponent(<QrScannerComponent onDecoded={onDecoded} onUsePasteLink={jest.fn()} />)

    expect(await screen.findByText(InviteLinkErrors.InvalidCode, {}, DECODE_TIMEOUT)).toBeVisible()
    expect(status()).toBe('scanning')
    expect(onDecoded).not.toHaveBeenCalled()
    expect(camera.stop).not.toHaveBeenCalled()

    // A valid code in the next frame is accepted and the error goes away
    camera.setFrame(qrImageData(memberLink))
    await waitFor(() => expect(onDecoded).toHaveBeenCalledWith(memberData), DECODE_TIMEOUT)
    expect(screen.queryByText(InviteLinkErrors.InvalidCode)).not.toBeInTheDocument()
    expect(camera.stop).toHaveBeenCalled()
  })

  it('offers the paste field when the camera is denied', async () => {
    camera = mockCamera({ error: cameraError('NotAllowedError') })
    const onDecoded = jest.fn()
    const onUsePasteLink = jest.fn()

    renderComponent(<QrScannerComponent onDecoded={onDecoded} onUsePasteLink={onUsePasteLink} />)

    expect(await screen.findByText(SCANNER_COPY.denied, {}, DECODE_TIMEOUT)).toBeVisible()
    expect(status()).toBe('denied')
    await userEvent.click(screen.getByTestId('qr-scanner-paste-link'))
    expect(onUsePasteLink).toHaveBeenCalledTimes(1)
    expect(onDecoded).not.toHaveBeenCalled()
  })

  it.each([
    ['darwin' as const, SCANNER_COPY.deniedDarwin],
    ['win32' as const, SCANNER_COPY.deniedWin32],
  ])('names the %s camera setting and opens it, keeping the paste field', async (platform, message) => {
    camera = mockCamera({ error: cameraError('NotAllowedError') })
    const onUsePasteLink = jest.fn()

    renderComponent(<QrScannerComponent platform={platform} onDecoded={jest.fn()} onUsePasteLink={onUsePasteLink} />)

    expect(await screen.findByText(message, {}, DECODE_TIMEOUT)).toBeVisible()
    expect(screen.queryByText(SCANNER_COPY.denied)).not.toBeInTheDocument()

    await userEvent.click(screen.getByTestId('qr-scanner-open-settings'))
    expect(invoke).toHaveBeenCalledWith(CAMERA_OPEN_PRIVACY_SETTINGS)

    // The paste field is still the way out for someone who will not grant the camera.
    await userEvent.click(screen.getByTestId('qr-scanner-paste-link'))
    expect(onUsePasteLink).toHaveBeenCalledTimes(1)
  })

  /** Linux has no camera permission to grant, so there is no page to send anyone to. */
  it('names no setting on Linux and offers only the paste field', async () => {
    camera = mockCamera({ error: cameraError('NotAllowedError') })

    renderComponent(<QrScannerComponent platform='linux' onDecoded={jest.fn()} onUsePasteLink={jest.fn()} />)

    expect(await screen.findByText(SCANNER_COPY.denied, {}, DECODE_TIMEOUT)).toBeVisible()
    expect(screen.queryByTestId('qr-scanner-open-settings')).not.toBeInTheDocument()
    expect(screen.getByTestId('qr-scanner-paste-link')).toBeVisible()
  })

  it('does not offer the setting when there is no camera to permit', async () => {
    camera = mockCamera({ error: cameraError('NotFoundError') })

    renderComponent(<QrScannerComponent platform='darwin' onDecoded={jest.fn()} onUsePasteLink={jest.fn()} />)

    expect(await screen.findByText(SCANNER_COPY.unavailable, {}, DECODE_TIMEOUT)).toBeVisible()
    expect(screen.queryByTestId('qr-scanner-open-settings')).not.toBeInTheDocument()
  })

  /**
   * The point of naming the setting: the user leaves for it, flips the toggle and comes back.
   * Regaining focus is the only signal that happened, so the scanner asks once more.
   */
  it('reopens the camera when the window is refocused after the setting was opened', async () => {
    camera = mockCamera({ error: cameraError('NotAllowedError') })
    const onDecoded = jest.fn()

    renderComponent(<QrScannerComponent platform='darwin' onDecoded={onDecoded} onUsePasteLink={jest.fn()} />)

    expect(await screen.findByText(SCANNER_COPY.deniedDarwin, {}, DECODE_TIMEOUT)).toBeVisible()
    expect(camera.getUserMedia).toHaveBeenCalledTimes(1)
    expect(accessRequests()).toBe(1)

    await userEvent.click(screen.getByTestId('qr-scanner-open-settings'))

    // The user grants the camera in the OS setting and returns to the window.
    camera.setError(undefined)
    camera.setFrame(qrImageData(memberLink))
    act(() => {
      fireEvent.focus(window)
    })

    await waitFor(() => expect(status()).toBe('scanning'), DECODE_TIMEOUT)
    expect(camera.getUserMedia).toHaveBeenCalledTimes(2)
    expect(accessRequests()).toBe(2)
    await waitFor(() => expect(onDecoded).toHaveBeenCalledWith(memberData), DECODE_TIMEOUT)
  })

  it('does not reopen the camera on a focus the user never asked for', async () => {
    camera = mockCamera({ error: cameraError('NotAllowedError') })

    renderComponent(<QrScannerComponent platform='darwin' onDecoded={jest.fn()} onUsePasteLink={jest.fn()} />)

    expect(await screen.findByText(SCANNER_COPY.deniedDarwin, {}, DECODE_TIMEOUT)).toBeVisible()

    camera.setError(undefined)
    act(() => {
      fireEvent.focus(window)
      fireEvent.focus(window)
    })

    // Still denied, and the camera was never asked a second time.
    expect(status()).toBe('denied')
    expect(camera.getUserMedia).toHaveBeenCalledTimes(1)
    expect(accessRequests()).toBe(1)
  })

  it('retries once per visit to the setting, not once per focus', async () => {
    camera = mockCamera({ error: cameraError('NotAllowedError') })

    renderComponent(<QrScannerComponent platform='win32' onDecoded={jest.fn()} onUsePasteLink={jest.fn()} />)

    expect(await screen.findByText(SCANNER_COPY.deniedWin32, {}, DECODE_TIMEOUT)).toBeVisible()
    await userEvent.click(screen.getByTestId('qr-scanner-open-settings'))

    // The toggle was left alone, so the one retry lands back on denied...
    act(() => {
      fireEvent.focus(window)
    })
    await waitFor(() => expect(camera?.getUserMedia).toHaveBeenCalledTimes(2), DECODE_TIMEOUT)
    expect(await screen.findByText(SCANNER_COPY.deniedWin32, {}, DECODE_TIMEOUT)).toBeVisible()

    // ...and every later focus is ignored until the setting is opened again.
    act(() => {
      fireEvent.focus(window)
      fireEvent.focus(window)
    })
    expect(camera.getUserMedia).toHaveBeenCalledTimes(2)

    await userEvent.click(screen.getByTestId('qr-scanner-open-settings'))
    act(() => {
      fireEvent.focus(window)
    })
    await waitFor(() => expect(camera?.getUserMedia).toHaveBeenCalledTimes(3), DECODE_TIMEOUT)
  })

  it('offers the paste field when there is no camera', async () => {
    camera = mockCamera({ error: cameraError('NotFoundError') })

    renderComponent(<QrScannerComponent onDecoded={jest.fn()} onUsePasteLink={jest.fn()} />)

    expect(await screen.findByText(SCANNER_COPY.unavailable, {}, DECODE_TIMEOUT)).toBeVisible()
    expect(status()).toBe('unavailable')
    expect(screen.getByText(SCANNER_COPY.pasteLink)).toBeVisible()
  })

  it('treats a camera that cannot be opened as unavailable', async () => {
    camera = mockCamera({ error: cameraError('NotReadableError') })

    renderComponent(<QrScannerComponent onDecoded={jest.fn()} onUsePasteLink={jest.fn()} />)

    expect(await screen.findByText(SCANNER_COPY.unavailable, {}, DECODE_TIMEOUT)).toBeVisible()
  })

  it('renders the sheet copy above the camera when given', async () => {
    camera = mockCamera()

    renderComponent(<QrScannerComponent intro={SCAN_QR_CODE_INTRO} onDecoded={jest.fn()} onUsePasteLink={jest.fn()} />)

    expect(screen.getByText(SCAN_QR_CODE_INTRO)).toBeVisible()
    await waitFor(() => expect(status()).toBe('scanning'), DECODE_TIMEOUT)
  })

  it('releases the camera on unmount', async () => {
    camera = mockCamera()

    const { unmount } = renderComponent(<QrScannerComponent onDecoded={jest.fn()} onUsePasteLink={jest.fn()} />)
    await waitFor(() => expect(status()).toBe('scanning'), DECODE_TIMEOUT)
    expect(camera.stop).not.toHaveBeenCalled()

    act(() => unmount())
    expect(camera.stop).toHaveBeenCalledTimes(1)
  })
})
