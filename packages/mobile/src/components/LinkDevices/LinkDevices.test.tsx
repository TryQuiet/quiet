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

  /**
   * The "Linked devices" list the frames draw under the rows (879:15644 with devices,
   * 879:15640 without). It belongs to the share direction, which is the one with a
   * community and so a team graph to read the devices from.
   */
  it('share: lists the other devices on the account', () => {
    const result = renderComponent(
      <LinkDevices
        direction='share'
        linkedDevices={[
          { deviceId: 'this', deviceName: 'pixel-here', isCurrent: true },
          { deviceId: 'laptop', deviceName: 'nyc-laptop', isCurrent: false },
          { deviceId: 'tablet', deviceName: 'nyc-tablet', isCurrent: false },
        ]}
      />
    )

    expect(result.getByTestId('linked-devices-list')).toBeTruthy()
    expect(result.getByTestId('linked-devices-list-label')).toBeTruthy()
    expect(result.getByTestId('linked-devices-scroll')).toBeTruthy()
    expect(result.getByTestId('linked-device-laptop')).toBeTruthy()
    expect(result.getByTestId('linked-device-tablet')).toBeTruthy()
    // This device is the one being read from, so it is never a row.
    expect(result.queryByTestId('linked-device-this')).toBeNull()
    expect(result.queryByTestId('no-linked-devices')).toBeNull()
  })

  it('share: drops a device removed from the account', () => {
    const result = renderComponent(
      <LinkDevices
        direction='share'
        linkedDevices={[
          { deviceId: 'gone', deviceName: 'old-tablet', isCurrent: false, removedAt: Date.now() },
          { deviceId: 'laptop', deviceName: 'nyc-laptop', isCurrent: false },
        ]}
      />
    )

    expect(result.queryByTestId('linked-device-gone')).toBeNull()
    expect(result.getByTestId('linked-device-laptop')).toBeTruthy()
  })

  it('share: says so when this is the only device', () => {
    const result = renderComponent(<LinkDevices direction='share' linkedDevices={[]} />)

    expect(result.getByTestId('linked-devices-list')).toBeTruthy()
    expect(result.getByTestId('no-linked-devices')).toBeTruthy()
  })

  it('share: draws nothing until a read comes back, so it never says "No linked devices" first', () => {
    const result = renderComponent(<LinkDevices direction='share' />)

    expect(result.queryByTestId('linked-devices-list')).toBeNull()
    expect(result.queryByTestId('no-linked-devices')).toBeNull()
  })

  it('receive: no list even with devices in hand, because that direction has no community', () => {
    const result = renderComponent(
      <LinkDevices direction='receive' linkedDevices={[{ deviceId: 'laptop', deviceName: 'l', isCurrent: false }]} />
    )

    expect(result.queryByTestId('linked-devices-list')).toBeNull()
  })

  it('keys rows on the device id, because names are not unique', () => {
    const result = renderComponent(
      <LinkDevices
        direction='share'
        linkedDevices={[
          { deviceId: 'one', deviceName: 'laptop', isCurrent: false },
          { deviceId: 'two', deviceName: 'laptop', isCurrent: false },
        ]}
      />
    )

    expect(result.getByTestId('linked-device-one')).toBeTruthy()
    expect(result.getByTestId('linked-device-two')).toBeTruthy()
  })
})
