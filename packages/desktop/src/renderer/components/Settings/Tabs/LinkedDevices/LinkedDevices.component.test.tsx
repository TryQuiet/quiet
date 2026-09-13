import '@testing-library/jest-dom'
import React from 'react'
import userEvent from '@testing-library/user-event'

import { renderComponent } from '../../../../testUtils/renderComponent'

import { LinkedDevicesComponent } from './LinkedDevices.component'
import { DISPLAY_QR_CODE_COPY } from '../../../Onboarding/DisplayQrCodeComponent'

const deviceLink = 'https://tryquiet.org/join#device-link'

describe('LinkedDevicesComponent (Settings → Linked devices)', () => {
  it('shows the QR code sheet content and never the raw link', () => {
    const result = renderComponent(
      <LinkedDevicesComponent deviceLink={deviceLink} isLoading={false} onReset={jest.fn()} />
    )

    expect(result.getByTestId('linked-devices-title')).toBeVisible()
    expect(result.getByTestId('settings-qr-code-box')).toBeVisible()
    expect(result.getByText(DISPLAY_QR_CODE_COPY.scan)).toBeVisible()
    expect(result.getByTestId('copy-device-link')).toBeEnabled()
    expect(result.getByTestId('reset-qr-code')).toBeEnabled()
    expect(result.queryByText(deviceLink)).toBeNull()
    expect(result.container.querySelector('input')).toBeNull()
  })

  it('shows link generation as the progress bar, with no Copy link or Reset QR code', () => {
    const result = renderComponent(<LinkedDevicesComponent deviceLink='' isLoading onReset={jest.fn()} />)

    expect(result.getByText(DISPLAY_QR_CODE_COPY.generating)).toBeVisible()
    expect(result.getByRole('progressbar')).toBeVisible()
    expect(result.queryByTestId('copy-device-link')).toBeNull()
    expect(result.queryByTestId('reset-qr-code')).toBeNull()
  })

  it('Reset QR code asks for a new link', async () => {
    const onReset = jest.fn()
    const result = renderComponent(
      <LinkedDevicesComponent deviceLink={deviceLink} isLoading={false} onReset={onReset} />
    )

    await userEvent.click(result.getByTestId('reset-qr-code'))
    expect(onReset).toHaveBeenCalledTimes(1)
  })

  it('lists the other devices of this user, or says there are none', () => {
    const noDevices = renderComponent(
      <LinkedDevicesComponent
        deviceLink=''
        isLoading={false}
        onReset={jest.fn()}
        linkedDevices={[{ deviceId: 'me', deviceName: 'me', isCurrent: true }]}
      />
    )
    expect(noDevices.getByTestId('no-linked-devices')).toHaveTextContent('No linked devices')
    noDevices.unmount()

    const withDevices = renderComponent(
      <LinkedDevicesComponent
        deviceLink=''
        isLoading={false}
        onReset={jest.fn()}
        linkedDevices={[
          { deviceId: 'me', deviceName: 'me', isCurrent: true },
          { deviceId: 'laptop', deviceName: 'laptop', isCurrent: false },
          { deviceId: 'old', deviceName: 'old-phone', isCurrent: false, removedAt: 1 },
        ]}
      />
    )
    expect(withDevices.getByTestId('linked-device-laptop')).toHaveTextContent('laptop')
    expect(withDevices.getByTestId('linked-device-laptop')).toHaveTextContent('Active')
    expect(withDevices.queryByTestId('linked-device-old-phone')).toBeNull()
    expect(withDevices.queryByTestId('no-linked-devices')).toBeNull()
  })
})
