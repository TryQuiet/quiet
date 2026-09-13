import React from 'react'
import { fireEvent } from '@testing-library/react-native'

import { renderComponent } from '../../utils/functions/renderComponent/renderComponent'

import { LINKED_DEVICE_QR_COPY, LinkedDeviceQRCode } from './LinkedDeviceQRCode.component'

const deviceLink = 'https://tryquiet.org/join#device-link'

describe('LinkedDeviceQRCode component', () => {
  it('shows the QR code sheet content and never the raw link', () => {
    const onCopyLink = jest.fn()
    const onReset = jest.fn()
    const result = renderComponent(
      <LinkedDeviceQRCode
        value={deviceLink}
        isLoading={false}
        onCopyLink={onCopyLink}
        onReset={onReset}
        handleBackButton={jest.fn()}
      />
    )

    expect(result.getByText(LINKED_DEVICE_QR_COPY.title)).toBeTruthy()
    expect(result.getByTestId('linked-device-qr-code-box')).toBeTruthy()
    expect(result.getByText(LINKED_DEVICE_QR_COPY.scan)).toBeTruthy()
    expect(result.queryByText(deviceLink)).toBeNull()

    fireEvent.press(result.getByTestId('copy-device-link'))
    expect(onCopyLink).toHaveBeenCalledTimes(1)
    fireEvent.press(result.getByTestId('reset-qr-code'))
    expect(onReset).toHaveBeenCalledTimes(1)
  })

  it('while the link is minted the box says so and both actions do nothing', () => {
    const onCopyLink = jest.fn()
    const onReset = jest.fn()
    const result = renderComponent(
      <LinkedDeviceQRCode value={''} isLoading onCopyLink={onCopyLink} onReset={onReset} handleBackButton={jest.fn()} />
    )

    expect(result.getByText(LINKED_DEVICE_QR_COPY.generating)).toBeTruthy()
    fireEvent.press(result.getByTestId('copy-device-link'))
    fireEvent.press(result.getByTestId('reset-qr-code'))
    expect(onCopyLink).not.toHaveBeenCalled()
    expect(onReset).not.toHaveBeenCalled()
  })
})
