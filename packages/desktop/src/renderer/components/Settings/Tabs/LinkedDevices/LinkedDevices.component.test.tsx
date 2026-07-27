import '@testing-library/jest-dom'
import React from 'react'

import { renderComponent } from '../../../../testUtils/renderComponent'

import { LinkedDevicesComponent } from './LinkedDevices.component'

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

    expect(result.getByText('Linked devices')).toBeVisible()
    expect(result.getByText('Link a new device')).toBeVisible()
    expect(result.getByText(/expires after 30 minutes/)).toBeVisible()
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

    expect(result.getByText('Generating device link…')).toBeVisible()
  })
})
