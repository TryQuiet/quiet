import React from 'react'
import { fireEvent } from '@testing-library/react-native'
import { renderComponent } from '../../utils/functions/renderComponent/renderComponent'
import { TermsOfService } from './TermsOfService.component'
import { serverHost } from '../../screens/TermsOfService/TermsOfService.screen'

describe('Agree & join', () => {
  it("shows the titled bar, the prototype's copy naming the host, and one button", () => {
    const onAgree = jest.fn()
    const onBack = jest.fn()
    const { getByText, getByLabelText, getByTestId, queryByText } = renderComponent(
      <TermsOfService onAgree={onAgree} onBack={onBack} serverHost={'api.tryquiet.org'} />
    )

    expect(getByText('Agree & join')).toBeTruthy()
    expect(getByText(/This community uses a server \(api\.tryquiet\.org\) for messaging without Tor\./)).toBeTruthy()
    expect(getByText('Privacy Policy and Terms of Use')).toBeTruthy()
    expect(queryByText('Leave Community')).toBeNull()
    expect(queryByText('Agree & Continue')).toBeNull()

    fireEvent.press(getByTestId('terms-of-service-agree'))
    expect(onAgree).toHaveBeenCalledTimes(1)

    fireEvent.press(getByLabelText('Go back'))
    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it('names no host when none is known', () => {
    const { getByText } = renderComponent(<TermsOfService onAgree={jest.fn()} onBack={jest.fn()} />)

    expect(getByText(/This community uses a server for messaging without Tor\./)).toBeTruthy()
  })

  it.each([
    ['wss://api.tryquiet.org/ws', 'api.tryquiet.org'],
    ['https://api.tryquiet.org:8443/', 'api.tryquiet.org:8443'],
    ['api.tryquiet.org', 'api.tryquiet.org'],
    ['', undefined],
    [undefined, undefined],
  ])('serverHost(%p) → %p', (endpoint, host) => {
    expect(serverHost(endpoint)).toBe(host)
  })
})
