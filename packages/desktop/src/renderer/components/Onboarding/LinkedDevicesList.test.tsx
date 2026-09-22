import React from 'react'
import '@testing-library/jest-dom/extend-expect'
import { screen } from '@testing-library/dom'

import type { LinkedDevice } from '@quiet/types'

import { renderComponent } from '../../testUtils/renderComponent'
import { LinkedDevicesList } from './LinkedDevicesList'

/**
 * The "Linked devices" list under the Link devices rows (2811:2575's hidden nodes).
 * It lists the account's other devices, and it says nothing at all until the backend
 * has answered — the reason the list was held back was a card that would read
 * "No linked devices" whether or not anything was linked.
 */
describe('LinkedDevicesList', () => {
  it('lists the other devices on the account', () => {
    const devices: LinkedDevice[] = [
      { deviceId: 'this', deviceName: 'desktop-here', isCurrent: true },
      { deviceId: 'phone', deviceName: 'nyc-phone', isCurrent: false },
      { deviceId: 'laptop', deviceName: 'nyc-laptop', isCurrent: false },
    ]
    renderComponent(<LinkedDevicesList linkedDevices={devices} />)

    expect(screen.getByTestId('linked-devices-list')).toBeVisible()
    expect(screen.getByTestId('linked-devices-list-label')).toHaveTextContent('Linked devices')
    expect(screen.getByTestId('linked-device-phone')).toHaveTextContent('nyc-phone')
    expect(screen.getByTestId('linked-device-laptop')).toHaveTextContent('nyc-laptop')
    expect(screen.queryByTestId('no-linked-devices')).not.toBeInTheDocument()
  })

  it('leaves this device out of the list it is read from', () => {
    renderComponent(<LinkedDevicesList linkedDevices={[{ deviceId: 'this', deviceName: 'here', isCurrent: true }]} />)

    expect(screen.queryByTestId('linked-device-this')).not.toBeInTheDocument()
    expect(screen.getByTestId('no-linked-devices')).toHaveTextContent('No linked devices')
  })

  it('drops a device that was removed from the account', () => {
    const devices: LinkedDevice[] = [
      { deviceId: 'gone', deviceName: 'old-tablet', isCurrent: false, removedAt: Date.now() },
      { deviceId: 'phone', deviceName: 'nyc-phone', isCurrent: false },
    ]
    renderComponent(<LinkedDevicesList linkedDevices={devices} />)

    expect(screen.queryByTestId('linked-device-gone')).not.toBeInTheDocument()
    expect(screen.getByTestId('linked-device-phone')).toBeVisible()
  })

  it('says so when this is the only device', () => {
    renderComponent(<LinkedDevicesList linkedDevices={[]} />)

    expect(screen.getByTestId('linked-devices-list')).toBeVisible()
    expect(screen.getByTestId('no-linked-devices')).toHaveTextContent('No linked devices')
  })

  it('draws nothing until a read comes back, so it never says "No linked devices" first', () => {
    renderComponent(<LinkedDevicesList linkedDevices={undefined} />)

    expect(screen.queryByTestId('linked-devices-list')).not.toBeInTheDocument()
    expect(screen.queryByTestId('no-linked-devices')).not.toBeInTheDocument()
  })

  it('keys rows on the device id, because names are not unique', () => {
    const devices: LinkedDevice[] = [
      { deviceId: 'one', deviceName: 'laptop', isCurrent: false },
      { deviceId: 'two', deviceName: 'laptop', isCurrent: false },
    ]
    renderComponent(<LinkedDevicesList linkedDevices={devices} />)

    expect(screen.getByTestId('linked-device-one')).toHaveTextContent('laptop')
    expect(screen.getByTestId('linked-device-two')).toHaveTextContent('laptop')
  })
})
