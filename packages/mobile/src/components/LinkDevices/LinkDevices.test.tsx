import React from 'react'
import { fireEvent } from '@testing-library/react-native'

import { renderComponent } from '../../utils/functions/renderComponent/renderComponent'

import { LinkDevices } from './LinkDevices.component'

describe('LinkDevices component', () => {
  it('share: Display QR code and Copy link, and Copy link calls back', () => {
    const onCopyLink = jest.fn()
    const onDisplayQrCode = jest.fn()
    const result = renderComponent(
      <LinkDevices direction='share' onCopyLink={onCopyLink} onDisplayQrCode={onDisplayQrCode} />
    )

    expect(result.getByText('Display QR code')).toBeTruthy()
    expect(result.getByText('Copy link')).toBeTruthy()
    expect(result.queryByText('Scan QR code')).toBeNull()
    expect(result.queryByText('Paste link')).toBeNull()
    fireEvent.press(result.getByTestId('link-devices-copy-link'))
    expect(onCopyLink).toHaveBeenCalledTimes(1)
    fireEvent.press(result.getByTestId('link-devices-display-qr'))
    expect(onDisplayQrCode).toHaveBeenCalledTimes(1)
  })

  it('receive: Scan QR code and Paste link only', () => {
    const result = renderComponent(<LinkDevices direction='receive' />)

    expect(result.getByText('Scan QR code')).toBeTruthy()
    expect(result.getByText('Paste link')).toBeTruthy()
    expect(result.queryByText('Display QR code')).toBeNull()
    expect(result.queryByText('Copy link')).toBeNull()
  })
})
