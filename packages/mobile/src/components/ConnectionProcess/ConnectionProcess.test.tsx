import { ConnectionProcessInfo } from '@quiet/types'
import React from 'react'
import Config from 'react-native-config'
import { renderComponent } from '../../utils/functions/renderComponent/renderComponent'
import ConnectionProcessComponent from './ConnectionProcess.component'

jest.mock('react-native-share', () => ({ default: { open: jest.fn() } }))
jest.mock('../../utils/sendLogs', () => ({ sendLogs: jest.fn() }))

const mutableConfig = Config as { NODE_ENV?: string }

describe('ConnectionProcessComponent', () => {
  const originalNodeEnv = mutableConfig.NODE_ENV

  afterEach(() => {
    mutableConfig.NODE_ENV = originalNodeEnv ?? 'staging'
  })

  it('renders the connection-process container, title, text, and learn-more link', () => {
    const { queryByTestId, getByTestId } = renderComponent(
      <ConnectionProcessComponent
        connectionProcess={{ number: 40, text: ConnectionProcessInfo.SPAWNING_HIDDEN_SERVICE }}
        openUrl={jest.fn()}
      />
    )

    expect(queryByTestId('connection-process-component')).not.toBeNull()
    expect(getByTestId('connection-process-title')).toHaveTextContent('Joining now!')
    expect(getByTestId('connection-process-text')).toHaveTextContent(ConnectionProcessInfo.SPAWNING_HIDDEN_SERVICE)
    expect(queryByTestId('learn-more-link')).not.toBeNull()
  })

  describe('Share logs link (dev/alpha gate)', () => {
    const render = () =>
      renderComponent(
        <ConnectionProcessComponent
          connectionProcess={{ number: 40, text: ConnectionProcessInfo.SPAWNING_HIDDEN_SERVICE }}
          openUrl={jest.fn()}
        />
      )

    it('hides Share logs link in production builds', () => {
      mutableConfig.NODE_ENV = 'production'
      const { queryByTestId } = render()
      expect(queryByTestId('share-logs-link')).toBeNull()
    })

    it('shows Share logs link in development builds', () => {
      mutableConfig.NODE_ENV = 'development'
      const { queryByTestId } = render()
      expect(queryByTestId('share-logs-link')).not.toBeNull()
    })

    it('shows Share logs link in staging/alpha builds', () => {
      mutableConfig.NODE_ENV = 'staging'
      const { queryByTestId } = render()
      expect(queryByTestId('share-logs-link')).not.toBeNull()
    })
  })
})
