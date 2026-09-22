import '@testing-library/jest-dom'
import React from 'react'
import userEvent from '@testing-library/user-event'

import { renderComponent } from '../../testUtils/renderComponent'
import { DeviceLinkConsentComponent } from './DeviceLinkConsent'

describe('DeviceLinkConsentComponent', () => {
  it('shows the exact direct endpoint and waits for an explicit decision', async () => {
    const confirm = jest.fn()
    const cancel = jest.fn()
    const endpoint = 'wss://link.example.test:443'
    const result = renderComponent(
      <DeviceLinkConsentComponent open qssEndpoint={endpoint} onCancel={cancel} onConfirm={confirm} />
    )

    expect(result.getByTestId('device-link-endpoint')).toHaveTextContent(endpoint)
    expect(result.getByText(/server can see your IP address/)).toBeVisible()
    expect(confirm).not.toHaveBeenCalled()

    await userEvent.click(result.getByTestId('confirm-device-link'))
    expect(confirm).toHaveBeenCalledTimes(1)
    expect(cancel).not.toHaveBeenCalled()
  })

  // The design (3054:4090) gives this step the Agree & join card: a titled bar with a back
  // arrow, and one pill. There is no second button — declining is the back arrow.
  it('is the Agree & join card: a titled bar whose back arrow declines, and one button', async () => {
    const confirm = jest.fn()
    const cancel = jest.fn()
    const result = renderComponent(
      <DeviceLinkConsentComponent open qssEndpoint={'wss://link.example.test:443'} onCancel={cancel} onConfirm={confirm} />
    )

    expect(result.getByText('Agree & join')).toBeVisible()
    expect(result.queryByText('No thanks')).not.toBeInTheDocument()
    expect(result.queryByText('Link this device?')).not.toBeInTheDocument()

    await userEvent.click(result.getByTestId('deviceLinkConsentModalBack'))
    expect(cancel).toHaveBeenCalledTimes(1)
    expect(confirm).not.toHaveBeenCalled()
  })

  it('falls back to the Tor wording when the invite carries no endpoint', () => {
    const result = renderComponent(
      <DeviceLinkConsentComponent open onCancel={jest.fn()} onConfirm={jest.fn()} />
    )

    expect(result.getByText(/connect to the linked device over Tor/)).toBeVisible()
    expect(result.queryByTestId('device-link-endpoint')).not.toBeInTheDocument()
  })
})
