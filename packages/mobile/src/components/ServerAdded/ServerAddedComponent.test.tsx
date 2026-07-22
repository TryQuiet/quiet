import React from 'react'
import { render } from '@testing-library/react-native'
import { ServerAddedComponent } from './ServerAddedComponent'

describe('ServerAddedComponent', () => {
  const originalQssEndpoint = process.env.QSS_ENDPOINT

  afterEach(() => {
    if (originalQssEndpoint == null) {
      delete process.env.QSS_ENDPOINT
    } else {
      process.env.QSS_ENDPOINT = originalQssEndpoint
    }
  })

  it('shows the server icon for the server configured by QSS_ENDPOINT', () => {
    process.env.QSS_ENDPOINT = 'wss://qss.example.com:443'

    const screen = render(<ServerAddedComponent visible onChoose={jest.fn()} serverHosts={['qss.example.com']} />)

    expect(screen.getByTestId('quiet-server-icon')).toBeTruthy()
    expect(screen.queryByTestId('non-quiet-server-warning-icon')).toBeNull()
    expect(screen.getByText('This community is hosted on Quiet’s server')).toBeTruthy()
  })

  it('treats normalized local hosts as the configured Quiet server', () => {
    process.env.QSS_ENDPOINT = 'ws://192.168.1.20:3003'

    const screen = render(<ServerAddedComponent visible onChoose={jest.fn()} serverHosts={['localhost']} />)

    expect(screen.getByTestId('quiet-server-icon')).toBeTruthy()
    expect(screen.queryByTestId('non-quiet-server-warning-icon')).toBeNull()
  })

  it('shows a warning and identifies a server not owned by Quiet', () => {
    process.env.QSS_ENDPOINT = 'wss://qss.example.com'

    const screen = render(
      <ServerAddedComponent visible onChoose={jest.fn()} serverHosts={['unknown-server.example.com']} />
    )

    expect(screen.getByTestId('non-quiet-server-warning-icon')).toBeTruthy()
    expect(screen.queryByTestId('quiet-server-icon')).toBeNull()
    expect(screen.getByText('This community uses a server not owned by Quiet')).toBeTruthy()
    expect(screen.getByText(/This server is not owned or operated by Quiet/)).toBeTruthy()
  })
})
