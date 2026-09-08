import React from 'react'
import Config from 'react-native-config'
import { renderComponent } from '../../utils/functions/renderComponent/renderComponent'
import { Splash } from './Splash.component'

jest.mock('react-native-share', () => ({ default: { open: jest.fn() } }))
jest.mock('../../utils/sendLogs', () => ({ sendLogs: jest.fn() }))
jest.mock('../../utils/shareAllData', () => ({ shareAllData: jest.fn() }))

const mutableConfig = Config as { NODE_ENV?: string }

const render = () => renderComponent(<Splash />)

describe('Splash', () => {
  const originalNodeEnv = mutableConfig.NODE_ENV

  afterEach(() => {
    mutableConfig.NODE_ENV = originalNodeEnv ?? 'staging'
  })

  it('renders the starting-backend splash', () => {
    const { queryByTestId, getByText } = render()
    expect(queryByTestId('loading')).not.toBeNull()
    expect(getByText('Starting backend')).not.toBeNull()
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
