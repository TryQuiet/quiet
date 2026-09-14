import '@testing-library/jest-dom'
import React from 'react'
import { renderComponent } from '../../../../testUtils/renderComponent'
import { LinkedDevicesComponent } from './LinkedDevices.component'

describe('LinkedDevicesComponent', () => {
  it('shows a private device link and linking instructions', () => {
    const link = 'https://tryquiet.org/join#device-link'
    const result = renderComponent(
      <LinkedDevicesComponent
        deviceLink={link}
        isLoading={false}
        revealLink={false}
        onToggleLinkVisibility={jest.fn()}
      />
    )
    expect(result.getByText('Linked devices')).toBeVisible()
    expect(result.getByText('Link a new device')).toBeVisible()
    expect(result.getByText(/expires after 30 minutes/)).toBeVisible()
    expect(result.queryByText(link)).toBeNull()
    expect(result.getByTestId('copy-device-link')).toBeVisible()
  })

  it('reveals the device link when requested', () => {
    const link = 'https://tryquiet.org/join#device-link'
    const result = renderComponent(
      <LinkedDevicesComponent deviceLink={link} isLoading={false} revealLink onToggleLinkVisibility={jest.fn()} />
    )
    expect(result.getByText(link)).toBeVisible()
  })

  it('shows a retryable failure instead of indefinite generation', () => {
    const result = renderComponent(
      <LinkedDevicesComponent deviceLink='' isLoading={false} revealLink={false} onToggleLinkVisibility={jest.fn()} />
    )

    expect(result.getByText('Device link unavailable')).toBeVisible()
    expect(result.getByText(/close and reopen Linked devices to try again/)).toBeVisible()
    expect(result.queryByText('Generating device link…')).toBeNull()
  })
})
