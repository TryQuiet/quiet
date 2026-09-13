import React from 'react'
import '@testing-library/jest-dom/extend-expect'
import { screen } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import { renderComponent } from '../../testUtils/renderComponent'
import TermsOfServiceComponent from './TermsOfServiceComponent'
import { serverHost } from './TermsOfService'

describe('Agree & join', () => {
  const render = () => {
    const handleClose = jest.fn()
    const onAgree = jest.fn()
    const openURL = jest.fn()
    renderComponent(
      <TermsOfServiceComponent
        open={true}
        handleClose={handleClose}
        onAgree={onAgree}
        openURL={openURL}
        qssEndPoint={'api.tryquiet.org'}
      />
    )
    return { handleClose, onAgree, openURL }
  }

  it("is the library's titled card: bar title, back arrow, the prototype's copy and one button", async () => {
    const { handleClose, onAgree, openURL } = render()

    expect(screen.getByText('Agree & join')).toBeVisible()
    const header = screen.getByTestId('TermOfServiceModalActions').closest('.Modalheader')
    expect(header).toHaveClass('ModalheaderBorder')
    expect(screen.getByTestId('agree-and-join')).toHaveTextContent(
      'This community uses a server (api.tryquiet.org) for messaging without Tor. By joining you agree to this Privacy Policy and Terms of Use.'
    )
    expect(screen.queryByText('Leave Community')).not.toBeInTheDocument()
    expect(screen.queryByTestId('TermOfService-Abort')).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Privacy Policy and Terms of Use' }))
    expect(openURL).toHaveBeenCalledTimes(1)

    await userEvent.click(screen.getByTestId('TermOfService-UseQuietServer'))
    expect(onAgree).toHaveBeenCalledTimes(1)
    expect(handleClose).not.toHaveBeenCalled()

    await userEvent.click(screen.getByTestId('TermOfServiceModalBack'))
    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it('names no host when none is known', () => {
    renderComponent(
      <TermsOfServiceComponent open={true} handleClose={jest.fn()} onAgree={jest.fn()} openURL={jest.fn()} />
    )

    expect(screen.getByTestId('agree-and-join')).toHaveTextContent(
      'This community uses a server for messaging without Tor.'
    )
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
