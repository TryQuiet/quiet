import React from 'react'
import { act, render } from '@testing-library/react-native'
import { useDispatch, useSelector } from 'react-redux'
import { ServerAddedDrawer } from './ServerAdded.drawer'
import { navigationActions } from '../../../store/navigation/navigation.slice'
import { ScreenNames } from '../../../const/ScreenNames.enum'

const mockDispatch = jest.fn()
const mockLeaveCommunity = jest.fn(() => ({ type: 'nativeServices/leaveCommunity' }))
const mockAcceptServer = jest.fn(() => ({ type: 'communities/acceptServer' }))
let mockState = {
  currentCommunity: {
    id: 'community-id',
    tosAccepted: false,
  },
  unacceptedServers: ['unexpected.example.com'],
  tosRequested: false,
}
let chooseServer: ((useServer: boolean) => Promise<void>) | undefined

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}))

jest.mock('@quiet/state-manager', () => ({
  communities: {
    selectors: {
      currentCommunity: (state: typeof mockState) => state.currentCommunity,
      unacceptedServers: (state: typeof mockState) => state.unacceptedServers,
      tosRequested: (state: typeof mockState) => state.tosRequested,
    },
    actions: {
      acceptServer: () => mockAcceptServer(),
    },
  },
}))

jest.mock('../../../store/nativeServices/nativeServices.slice', () => ({
  nativeServicesActions: {
    leaveCommunity: () => mockLeaveCommunity(),
  },
}))

jest.mock('../../ServerAdded/ServerAddedComponent', () => {
  const React = require('react')
  const { View } = require('react-native')
  return ({ onChoose }: { onChoose: (useServer: boolean) => Promise<void> }) => {
    chooseServer = onChoose
    return <View testID='server-added-content' />
  }
})

jest.mock('../ModalBottomDrawer.component', () => {
  const React = require('react')
  const { View } = require('react-native')
  return {
    ModalBottomDrawer: ({ visible, children }: { visible: boolean; children: React.ReactNode }) =>
      visible ? <View testID='server-added-drawer'>{children}</View> : null,
  }
})

describe('ServerAddedDrawer', () => {
  beforeEach(() => {
    mockState = {
      currentCommunity: { id: 'community-id', tosAccepted: false },
      unacceptedServers: ['unexpected.example.com'],
      tosRequested: false,
    }
    mockDispatch.mockClear()
    mockLeaveCommunity.mockClear()
    mockAcceptServer.mockClear()
    chooseServer = undefined
    ;(useDispatch as jest.Mock).mockReturnValue(mockDispatch)
    ;(useSelector as jest.Mock).mockImplementation(selector => selector(mockState))
  })

  it('starts server acceptance and opens ToS when consent is still required', async () => {
    render(<ServerAddedDrawer />)

    await act(async () => {
      await chooseServer?.(true)
    })

    expect(mockDispatch).toHaveBeenCalledWith({ type: 'communities/acceptServer' })
    expect(mockDispatch).toHaveBeenCalledWith(
      navigationActions.navigation({ screen: ScreenNames.TermsOfServiceScreen })
    )
  })

  it('leaves the community when the unexpected server is rejected', async () => {
    render(<ServerAddedDrawer />)

    await act(async () => {
      await chooseServer?.(false)
    })

    expect(mockDispatch).toHaveBeenCalledWith({ type: 'nativeServices/leaveCommunity' })
  })
})
