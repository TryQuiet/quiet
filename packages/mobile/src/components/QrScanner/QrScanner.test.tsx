import React from 'react'
import { act, fireEvent, waitFor } from '@testing-library/react-native'
import type { ReactTestInstance } from 'react-test-renderer'

import {
  JOIN_WITH_QR_CODE_HEADING,
  SCAN_QR_CODE_HEADING,
  SCAN_QR_CODE_INTRO,
  composeInvitationShareUrl,
  validInvitationDatav4,
} from '@quiet/common'
import { InvitationKind } from '@quiet/types'

import { resetVisionCameraMock, visionCameraMock } from '../../tests/mocks/reactNativeVisionCamera'
import { renderComponent } from '../../utils/functions/renderComponent/renderComponent'
import { INVALID_INVITATION_ERROR } from '../../utils/inviteLink'
import { QrScanner } from './QrScanner.component'
import { SCANNER_COPY } from './QrScannerSheet.component'

const memberLink = composeInvitationShareUrl(validInvitationDatav4[0])

/** What the native code scanner does when a QR code is in the frame. */
const scan = (camera: ReactTestInstance, value: string) =>
  act(() => {
    camera.props.codeScanner.onCodeScanned([{ type: 'qr', value }], { width: 1280, height: 720 })
  })

describe('QrScanner', () => {
  beforeEach(resetVisionCameraMock)

  const renderScanner = (props: Partial<React.ComponentProps<typeof QrScanner>> = {}) => {
    const onDecoded = jest.fn()
    const onClose = jest.fn()
    const onUsePasteLink = jest.fn()
    const result = renderComponent(
      <QrScanner
        title={JOIN_WITH_QR_CODE_HEADING}
        onDecoded={onDecoded}
        onClose={onClose}
        onUsePasteLink={onUsePasteLink}
        {...props}
      />
    )
    return { result, onDecoded, onClose, onUsePasteLink }
  }

  it('scans with the framed square when the camera is already allowed', () => {
    const { result } = renderScanner()
    expect(result.queryByTestId('qr-scanner-decoded')).toBeNull()
    expect(result.getByTestId('qr-scanner-viewfinder').props.accessibilityValue).toEqual({ text: 'scanning' })
    expect(result.getByTestId('qr-scanner-frame')).toBeTruthy()
    expect(result.getByTestId('qr-scanner-camera').props.isActive).toBe(true)
    expect(result.getByTestId('qr-scanner-camera').props.codeScanner.codeTypes).toEqual(['qr'])
    expect(result.queryByTestId('qr-scanner-error')).toBeNull()
  })

  it('asks for the camera first and scans once it is granted', async () => {
    visionCameraMock.hasPermission = false
    const { result } = renderScanner()
    expect(result.getByText(SCANNER_COPY.requesting)).toBeTruthy()
    expect(result.queryByTestId('qr-scanner-camera')).toBeNull()
    await waitFor(() => expect(result.getByTestId('qr-scanner-frame')).toBeTruthy())
    expect(result.getByTestId('qr-scanner-camera').props.isActive).toBe(true)
  })

  it('offers the paste field when the camera is denied', async () => {
    visionCameraMock.hasPermission = false
    visionCameraMock.grant = false
    const { result, onUsePasteLink } = renderScanner()
    await waitFor(() => expect(result.getByTestId('qr-scanner-message')).toHaveTextContent(SCANNER_COPY.denied))
    expect(result.queryByTestId('qr-scanner-camera')).toBeNull()
    expect(result.queryByTestId('qr-scanner-frame')).toBeNull()
    fireEvent.press(result.getByTestId('qr-scanner-paste-link'))
    expect(onUsePasteLink).toHaveBeenCalledTimes(1)
  })

  it('offers the paste field when there is no back camera', () => {
    visionCameraMock.device = undefined
    const { result, onUsePasteLink } = renderScanner()
    expect(result.getByTestId('qr-scanner-message')).toHaveTextContent(SCANNER_COPY.unavailable)
    expect(result.queryByTestId('qr-scanner-camera')).toBeNull()
    fireEvent.press(result.getByTestId('qr-scanner-paste-link'))
    expect(onUsePasteLink).toHaveBeenCalledTimes(1)
  })

  it('treats a camera error as no camera', () => {
    const { result } = renderScanner()
    act(() => {
      result.getByTestId('qr-scanner-camera').props.onError({ code: 'device/camera-already-in-use', message: 'busy' })
    })
    expect(result.getByTestId('qr-scanner-message')).toHaveTextContent(SCANNER_COPY.unavailable)
  })

  it("shows the paste field's error for a code that is not a Quiet invitation and keeps scanning", () => {
    const { result, onDecoded } = renderScanner()
    scan(result.getByTestId('qr-scanner-camera'), 'https://example.com/menu')
    expect(result.getByTestId('qr-scanner-error')).toHaveTextContent(INVALID_INVITATION_ERROR)
    expect(result.getByTestId('qr-scanner-frame')).toBeTruthy()
    expect(result.getByTestId('qr-scanner-camera').props.isActive).toBe(true)
    expect(onDecoded).not.toHaveBeenCalled()
  })

  it('hands a decoded Quiet invitation over once and stops the camera', () => {
    const { result, onDecoded } = renderScanner()
    scan(result.getByTestId('qr-scanner-camera'), 'https://example.com/menu')
    scan(result.getByTestId('qr-scanner-camera'), memberLink)
    scan(result.getByTestId('qr-scanner-camera'), memberLink)
    expect(onDecoded).toHaveBeenCalledTimes(1)
    expect(onDecoded).toHaveBeenCalledWith({ ...validInvitationDatav4[0], kind: InvitationKind.Member })
    expect(result.getByTestId('qr-scanner-camera').props.isActive).toBe(false)
    expect(result.getByTestId('qr-scanner-viewfinder').props.accessibilityValue).toEqual({ text: 'stopped' })
    expect(result.queryByTestId('qr-scanner-frame')).toBeNull()
    expect(result.getByTestId('qr-scanner-decoded')).toBeTruthy()
    expect(result.queryByTestId('qr-scanner-error')).toBeNull()
  })

  it('closes from the title bar', () => {
    const { result, onClose } = renderScanner()
    fireEvent.press(result.getByTestId('appbar_action_item'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('carries the Link devices copy above the camera', () => {
    const { result } = renderScanner({
      title: SCAN_QR_CODE_HEADING,
      intro: SCAN_QR_CODE_INTRO,
      testID: 'link-devices-qr-scanner',
    })
    expect(result.getByText(SCAN_QR_CODE_HEADING)).toBeTruthy()
    expect(result.getByText(SCAN_QR_CODE_INTRO)).toBeTruthy()
    expect(result.getByTestId('link-devices-qr-scanner-frame')).toBeTruthy()
  })
})
