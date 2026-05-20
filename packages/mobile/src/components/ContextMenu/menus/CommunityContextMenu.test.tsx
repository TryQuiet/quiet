import React from 'react'
import Config from 'react-native-config'

import { renderComponent } from '../../../tests/utils/renderComponent'
import { CommunityContextMenu } from './CommunityContextMenu.container'

jest.mock('react-native-share', () => ({ default: { open: jest.fn() } }))
jest.mock('../../../utils/sendLogs', () => ({ sendLogs: jest.fn() }))
jest.mock('../../../utils/shareAllData', () => ({ shareAllData: jest.fn() }))
jest.mock('../../../hooks/useContextMenu', () => ({
  useContextMenu: () => ({ visible: true, handleOpen: jest.fn(), handleClose: jest.fn() }),
}))

const mutableConfig = Config as { NODE_ENV?: string }

describe('CommunityContextMenu (dev/alpha gate for "Share logs")', () => {
  const originalNodeEnv = mutableConfig.NODE_ENV

  afterEach(() => {
    mutableConfig.NODE_ENV = originalNodeEnv ?? 'staging'
  })

  it('hides "Share logs" in production builds', () => {
    mutableConfig.NODE_ENV = 'production'
    const { queryByText } = renderComponent(<CommunityContextMenu />)
    expect(queryByText('Share logs')).toBeNull()
  })

  it('shows "Share logs" in development builds', () => {
    mutableConfig.NODE_ENV = 'development'
    const { queryByText } = renderComponent(<CommunityContextMenu />)
    expect(queryByText('Share logs')).not.toBeNull()
  })

  it('shows "Share logs" in staging/alpha builds', () => {
    mutableConfig.NODE_ENV = 'staging'
    const { queryByText } = renderComponent(<CommunityContextMenu />)
    expect(queryByText('Share logs')).not.toBeNull()
  })
})

describe('CommunityContextMenu (dev/alpha gate for "Share all data")', () => {
  const originalNodeEnv = mutableConfig.NODE_ENV

  afterEach(() => {
    mutableConfig.NODE_ENV = originalNodeEnv ?? 'staging'
  })

  it('hides "Share all data" in production builds', () => {
    mutableConfig.NODE_ENV = 'production'
    const { queryByText } = renderComponent(<CommunityContextMenu />)
    expect(queryByText('Share all data')).toBeNull()
  })

  it('shows "Share all data" in development builds', () => {
    mutableConfig.NODE_ENV = 'development'
    const { queryByText } = renderComponent(<CommunityContextMenu />)
    expect(queryByText('Share all data')).not.toBeNull()
  })

  it('shows "Share all data" in staging/alpha builds', () => {
    mutableConfig.NODE_ENV = 'staging'
    const { queryByText } = renderComponent(<CommunityContextMenu />)
    expect(queryByText('Share all data')).not.toBeNull()
  })
})
