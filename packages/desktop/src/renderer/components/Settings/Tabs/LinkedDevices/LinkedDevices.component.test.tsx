import '@testing-library/jest-dom'
import React from 'react'

import { renderComponent } from '../../../../testUtils/renderComponent'

import type { LinkedDevice } from '@quiet/types'

import { LinkedDevicesComponent } from './LinkedDevices.component'

const deviceLink = 'https://tryquiet.org/join#device-link'

const renderWithDevices = (linkedDevices?: LinkedDevice[]) =>
  renderComponent(
    <LinkedDevicesComponent
      deviceLink={deviceLink}
      isLoading={false}
      revealLink={false}
      onToggleLinkVisibility={jest.fn()}
      linkedDevices={linkedDevices}
    />
  )

describe('LinkedDevicesComponent', () => {
  it('shows a private device link and linking instructions', () => {
    const deviceLink = 'https://tryquiet.org/join#device-link'
    const result = renderComponent(
      <LinkedDevicesComponent
        deviceLink={deviceLink}
        isLoading={false}
        revealLink={false}
        onToggleLinkVisibility={jest.fn()}
      />
    )

    expect(result.getByTestId('linked-devices-title')).toHaveTextContent('Linked devices')
    expect(result.getByText('Link a new device')).toBeVisible()
    expect(result.getByText(/expires after 30 minutes/)).toBeVisible()
    expect(result.getByText(/more than one device/)).toBeVisible()
    expect(result.getByText(/historical encryption keys/)).toBeVisible()
    expect(result.queryByText(deviceLink)).toBeNull()
    expect(result.getByTestId('copy-device-link')).toBeVisible()
  })

  it('reveals the device link when requested', () => {
    const deviceLink = 'https://tryquiet.org/join#device-link'
    const result = renderComponent(
      <LinkedDevicesComponent deviceLink={deviceLink} isLoading={false} revealLink onToggleLinkVisibility={jest.fn()} />
    )

    expect(result.getByText(deviceLink)).toBeVisible()
  })

  it('shows link generation progress', () => {
    const result = renderComponent(
      <LinkedDevicesComponent deviceLink='' isLoading revealLink={false} onToggleLinkVisibility={jest.fn()} />
    )

    expect(result.getByTestId('linked-devices-title')).toHaveTextContent('Linked devices')
    expect(result.getByText('Generating device link…')).toBeVisible()
  })

  it('lists the other devices on the account', () => {
    const result = renderWithDevices([
      { deviceId: 'this', deviceName: 'desktop-here', isCurrent: true },
      { deviceId: 'phone', deviceName: 'nyc-phone', isCurrent: false },
      { deviceId: 'laptop', deviceName: 'nyc-laptop', isCurrent: false },
    ])

    expect(result.getByTestId('linked-devices-list')).toBeVisible()
    expect(result.getByTestId('linked-devices-list-label')).toHaveTextContent('Linked devices')
    expect(result.getByTestId('linked-device-phone')).toHaveTextContent('nyc-phone')
    expect(result.getByTestId('linked-device-laptop')).toHaveTextContent('nyc-laptop')
    expect(result.queryByTestId('no-linked-devices')).toBeNull()
  })

  it('leaves this device out of the list it is read from', () => {
    const result = renderWithDevices([{ deviceId: 'this', deviceName: 'desktop-here', isCurrent: true }])

    expect(result.queryByTestId('linked-device-this')).toBeNull()
    expect(result.getByTestId('no-linked-devices')).toHaveTextContent('No linked devices')
  })

  it('drops a device that was removed from the account', () => {
    const result = renderWithDevices([
      { deviceId: 'this', deviceName: 'desktop-here', isCurrent: true },
      { deviceId: 'gone', deviceName: 'old-tablet', isCurrent: false, removedAt: Date.now() },
      { deviceId: 'phone', deviceName: 'nyc-phone', isCurrent: false },
    ])

    expect(result.queryByTestId('linked-device-gone')).toBeNull()
    expect(result.getByTestId('linked-device-phone')).toBeVisible()
  })

  it('says so when this is the only device', () => {
    const result = renderWithDevices([])

    expect(result.getByTestId('linked-devices-list')).toBeVisible()
    expect(result.getByTestId('no-linked-devices')).toHaveTextContent('No linked devices')
  })

  it('draws no list until a read comes back, so it never says "No linked devices" first', () => {
    const result = renderWithDevices(undefined)

    expect(result.queryByTestId('linked-devices-list')).toBeNull()
    expect(result.queryByTestId('no-linked-devices')).toBeNull()
  })
})
