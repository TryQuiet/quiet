import React from 'react'
import '@testing-library/jest-dom/extend-expect'
import { screen } from '@testing-library/dom'
import { renderComponent } from '../renderer/testUtils/renderComponent'
import { prepareStore } from '../renderer/testUtils/prepareStore'
import { StoreKeys } from '../renderer/store/store.keys'
import { socketActions, SocketState } from '../renderer/sagas/socket/socket.slice'
import LoadingPanel, { LoadingPanelMessage } from '../renderer/components/LoadingPanel/LoadingPanel'
import MockedSocket from 'socket.io-mock'
import { ioMock } from '../shared/setupTests'
import { communities, getFactory, publicChannels } from '@quiet/nectar'
import { DateTime } from 'luxon'
import { act } from 'react-dom/test-utils'

jest.setTimeout(20_000)

describe('Loading panel', () => {
  let socket: MockedSocket

  beforeEach(() => {
    socket = new MockedSocket()
    ioMock.mockImplementation(() => socket)
    window.ResizeObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }));
  })

  it('Displays loading panel before connecting websocket', async () => {
    const { store } = await prepareStore(
      {
        [StoreKeys.Socket]: {
          ...new SocketState(),
          isConnected: false
        }
      }
    )

    renderComponent(
      <>
        <LoadingPanel />
      </>,
      store
    )

    // Verify loading panel is visible
    expect(screen.getByTestId('spinnerLoader')).toBeVisible()

    // Verify proper messages is displayed
    const startingApplicationMessage = screen.getByText(LoadingPanelMessage.StartingApplication)
    expect(startingApplicationMessage).toBeVisible()

    store.dispatch(socketActions.setConnected())

    await act(async () => {})

    // Verify loading panel dissapeared
    expect(screen.queryByTestId('spinnerLoader')).toBeNull()
  })

  it('Displays loading panel between registering username and replicating data', async () => {
    const { store } = await prepareStore(
      {},
      socket // Fork Nectar's sagas
    )

    const factory = await getFactory(store)

    const community = (await factory.build<typeof communities.actions.addNewCommunity>('Community'))
      .payload

    const channel = (
      await factory.build<typeof publicChannels.actions.addChannel>('PublicChannel', {
        communityId: community.id,
        channel: {
          name: 'general',
          description: 'Welcome to #general',
          timestamp: DateTime.utc().valueOf(),
          owner: 'owner',
          address: 'general'
        }
      })
    ).payload

    store.dispatch(communities.actions.addNewCommunity(community))
    store.dispatch(communities.actions.setCurrentCommunity(community.id))
    store.dispatch(publicChannels.actions.addPublicChannelsList({ id: community.id }))

    renderComponent(
      <>
        <LoadingPanel />
      </>,
      store
    )

    // Verify loading panel is visible
    expect(screen.getByTestId('spinnerLoader')).toBeVisible()

    // Verify proper messages is displayed
    const startingApplicationMessage = screen.getByText(LoadingPanelMessage.FetchingData)
    expect(startingApplicationMessage).toBeVisible()

    store.dispatch(publicChannels.actions.addChannel(channel))

    await act(async () => {})

    // Verify loading panel dissapeared
    expect(screen.queryByTestId('spinnerLoader')).toBeNull()
  })
})
