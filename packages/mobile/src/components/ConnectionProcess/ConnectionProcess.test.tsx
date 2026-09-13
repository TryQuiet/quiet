import { ConnectionProcessInfo } from '@quiet/types'
import React from 'react'
import Config from 'react-native-config'
import { renderComponent } from '../../utils/functions/renderComponent/renderComponent'
import ConnectionProcessComponent, { TOR_LEARN_MORE, TOR_STATUS } from './ConnectionProcess.component'

jest.mock('react-native-share', () => ({ default: { open: jest.fn() } }))
jest.mock('../../utils/sendLogs', () => ({ sendLogs: jest.fn() }))
jest.mock('../../utils/shareAllData', () => ({ shareAllData: jest.fn() }))

const mutableConfig = Config as { NODE_ENV?: string }

const render = (usesServer = false) =>
  renderComponent(
    <ConnectionProcessComponent
      connectionProcess={{ number: 40, text: ConnectionProcessInfo.SPAWNING_HIDDEN_SERVICE }}
      openUrl={jest.fn()}
      usesServer={usesServer}
    />
  )

describe('ConnectionProcessComponent', () => {
  const originalNodeEnv = mutableConfig.NODE_ENV

  afterEach(() => {
    mutableConfig.NODE_ENV = originalNodeEnv ?? 'staging'
  })

  it('renders the connection-process container, title and learn-more link over Tor', () => {
    const { queryByTestId, getByTestId } = render()
    expect(queryByTestId('connection-process-component')).not.toBeNull()
    expect(getByTestId('connection-process-title')).toHaveTextContent('Joining now!')
    expect(queryByTestId('learn-more-link')).not.toBeNull()
  })

  describe('over Tor', () => {
    it('names Tor as the connection under way, and keeps the phase under it', () => {
      const { getByTestId } = render(false)
      expect(getByTestId('connection-process-text')).toHaveTextContent(TOR_STATUS)
      expect(getByTestId('connection-process-secondary')).toHaveTextContent(
        ConnectionProcessInfo.SPAWNING_HIDDEN_SERVICE
      )
    })

    it('explains why Tor is slow', () => {
      const { getByTestId } = render(false)
      // Regex, not string: this matcher compares strings exactly.
      expect(getByTestId('connection-process-tor-explanation')).toHaveTextContent(/privacy tool Tor/)
      expect(getByTestId('connection-process-tor-explanation')).toHaveTextContent(
        /This first time might take 30 seconds, 10 minutes, or even longer\./
      )
      expect(getByTestId('connection-process-tor-explanation')).toHaveTextContent(
        /You can exit the app - we'll notify you once you're connected!/
      )
    })
  })

  describe('on a server', () => {
    it('says nothing about Tor', () => {
      const { queryByTestId, queryByText } = render(true)
      expect(queryByTestId('connection-process-tor-explanation')).toBeNull()
      expect(queryByTestId('learn-more-link')).toBeNull()
      expect(queryByText(TOR_LEARN_MORE)).toBeNull()
      expect(queryByText(TOR_STATUS)).toBeNull()
    })

    it('keeps the status line the app already prints', () => {
      const { getByTestId, queryByTestId } = render(true)
      expect(getByTestId('connection-process-text')).toHaveTextContent(ConnectionProcessInfo.SPAWNING_HIDDEN_SERVICE)
      expect(queryByTestId('connection-process-secondary')).toBeNull()
    })
  })

  describe('Share logs link (dev/alpha gate)', () => {
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

  describe('Share all data link (dev/alpha gate)', () => {
    it('hides Share all data link in production builds', () => {
      mutableConfig.NODE_ENV = 'production'
      const { queryByTestId } = render()
      expect(queryByTestId('share-all-data-link')).toBeNull()
    })

    it('shows Share all data link in development builds', () => {
      mutableConfig.NODE_ENV = 'development'
      const { queryByTestId } = render()
      expect(queryByTestId('share-all-data-link')).not.toBeNull()
    })

    it('shows Share all data link in staging/alpha builds', () => {
      mutableConfig.NODE_ENV = 'staging'
      const { queryByTestId } = render()
      expect(queryByTestId('share-all-data-link')).not.toBeNull()
    })
  })
})
