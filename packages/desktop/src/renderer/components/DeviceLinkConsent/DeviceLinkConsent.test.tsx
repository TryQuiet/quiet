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
})
