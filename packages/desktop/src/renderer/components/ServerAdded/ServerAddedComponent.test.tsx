import React from 'react'
import '@testing-library/jest-dom/extend-expect'
import { screen } from '@testing-library/react'
import { renderComponent } from '../../testUtils'
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

    renderComponent(<ServerAddedComponent open onChoose={jest.fn()} serverHosts={['qss.example.com']} />)

    expect(screen.getByTestId('ServerAdded-QuietServerIcon')).toBeInTheDocument()
    expect(screen.queryByTestId('ServerAdded-NonQuietServerWarningIcon')).not.toBeInTheDocument()
    expect(screen.getByTestId('ServerAdded-Title')).toHaveTextContent('This community is hosted on Quiet’s server')
  })

  it('treats normalized local hosts as the configured Quiet server', () => {
    process.env.QSS_ENDPOINT = 'ws://192.168.1.20:3003'

    renderComponent(<ServerAddedComponent open onChoose={jest.fn()} serverHosts={['localhost']} />)

    expect(screen.getByTestId('ServerAdded-QuietServerIcon')).toBeInTheDocument()
    expect(screen.queryByTestId('ServerAdded-NonQuietServerWarningIcon')).not.toBeInTheDocument()
  })

  it('shows a warning and identifies a server not owned by Quiet', () => {
    process.env.QSS_ENDPOINT = 'wss://qss.example.com'

    renderComponent(<ServerAddedComponent open onChoose={jest.fn()} serverHosts={['unknown-server.example.com']} />)

    expect(screen.getByTestId('ServerAdded-NonQuietServerWarningIcon')).toBeInTheDocument()
    expect(screen.queryByTestId('ServerAdded-QuietServerIcon')).not.toBeInTheDocument()
    expect(screen.getByTestId('ServerAdded-Title')).toHaveTextContent('This community uses a server not owned by Quiet')
    expect(screen.getByTestId('ServerAdded-Message')).toHaveTextContent('This server is not owned or operated by Quiet')
  })
})
