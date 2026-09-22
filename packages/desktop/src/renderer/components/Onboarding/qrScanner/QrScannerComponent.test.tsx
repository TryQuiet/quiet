import React from 'react'
import '@testing-library/jest-dom/extend-expect'
import { act, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { SCAN_QR_CODE_INTRO, composeInvitationShareUrl, validInvitationDatav4 } from '@quiet/common'
import { InvitationKind } from '@quiet/types'

import { renderComponent } from '../../../testUtils/renderComponent'
import { qrImageData } from '../../../testUtils/qrImage'
import { cameraError, mockCamera } from '../../../testUtils/mockCamera'
import { InviteLinkErrors } from '../../../forms/fieldsErrors'
import { QrScannerComponent, SCANNER_COPY } from './QrScannerComponent'

const memberData = { ...validInvitationDatav4[0], kind: InvitationKind.Member as const }
const memberLink = composeInvitationShareUrl(memberData)

let camera: ReturnType<typeof mockCamera> | undefined

afterEach(() => {
  camera?.restore()
  camera = undefined
})

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
