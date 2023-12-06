import React from 'react'
import '@testing-library/jest-dom/extend-expect'
import { screen, waitFor } from '@testing-library/dom'
import { renderComponent } from '../renderer/testUtils/renderComponent'
import { prepareStore } from '../renderer/testUtils/prepareStore'
import { StoreKeys } from '../renderer/store/store.keys'
import { socketActions, SocketState } from '../renderer/sagas/socket/socket.slice'
import LoadingPanel from '../renderer/components/LoadingPanel/LoadingPanel'
import CreateUsername from '../renderer/components/CreateUsername/CreateUsername'
import MockedSocket from 'socket.io-mock'
import { ioMock } from '../shared/setupTests'
import {
  communities,
  identity,
  getFactory,
  publicChannels,
  network,
  LoadingPanelType,
  connection,
} from '@quiet/state-manager'
import { DateTime } from 'luxon'
import { act } from 'react-dom/test-utils'
import { modalsActions } from '../renderer/sagas/modals/modals.slice'
import { ModalName } from '../renderer/sagas/modals/modals.types'

jest.setTimeout(20_000)
const mockNotification = jest.fn()
const notification = jest.fn().mockImplementation(() => {
  return mockNotification
})
// @ts-expect-error
window.Notification = notification

describe('Loading panel', () => {
  let socket: MockedSocket

  beforeEach(() => {
    socket = new MockedSocket()
    ioMock.mockImplementation(() => socket)
    window.ResizeObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }))
  })

  it.skip('Displays loading panel before connecting websocket', async () => {
    // todo loading panel in other electron window

    const { store } = await prepareStore({
      [StoreKeys.Socket]: {
        ...new SocketState(),
        isConnected: false,
      },
    })

    renderComponent(
      <>
        <LoadingPanel />
      </>,
      store
    )

    // Verify loading panel is visible
    expect(screen.getByTestId('startingPanelComponent')).toBeVisible()

    // Verify proper messages is displayed
    const startingApplicationMessage = screen.getByText(LoadingPanelType.StartingApplication)
    expect(startingApplicationMessage).toBeVisible()

    store.dispatch(socketActions.setConnected())

    await act(async () => {})

    // Verify loading panel dissapeared
    expect(screen.queryByTestId('startingPanelComponent')).toBeNull()
  })

  it('Displays loading panel between registering username and replicating data', async () => {
    const { store } = await prepareStore(
      {},
      socket // Fork state manager's sagas
    )

    const factory = await getFactory(store)

    const community = (await factory.build<typeof communities.actions.storeCommunity>('Community')).payload

    store.dispatch(communities.actions.storeCommunity(community))
    store.dispatch(communities.actions.setCurrentCommunity(community.id))

    const channel = (
      await factory.build<typeof publicChannels.actions.addChannel>('PublicChannel', {
        communityId: community.id,
        channel: {
          name: 'general',
          description: 'Welcome to #general',
          timestamp: DateTime.utc().valueOf(),
          owner: 'owner',
          id: 'general',
        },
      })
    ).payload

    await factory.create<ReturnType<typeof identity.actions.storeIdentity>['payload']>('Identity', {
      id: community.id,
      nickname: 'alice',
    })

    store.dispatch(communities.actions.storeCommunity(community))
    store.dispatch(communities.actions.setCurrentCommunity(community.id))
    store.dispatch(network.actions.setLoadingPanelType(LoadingPanelType.Joining))
    store.dispatch(modalsActions.openModal({ name: ModalName.loadingPanel }))
    renderComponent(
      <>
        <LoadingPanel />
      </>,
      store
    )

    // Verify loading panel is visible
    expect(screen.getByTestId('joiningPanelComponent')).toBeVisible()

    // Verify proper messages is displayed
    const startingApplicationMessage = screen.getByText('Joining now!')
    expect(startingApplicationMessage).toBeVisible()

    store.dispatch(publicChannels.actions.addChannel(channel))
    store.dispatch(modalsActions.closeModal(ModalName.loadingPanel))
    await act(async () => {})

    // Verify loading panel dissapeared
    expect(screen.queryByTestId('joiningPanelComponent')).toBeNull()
  })

  it('Do not display Loading panel when community and identity are created but user csr is missing', async () => {
    const { store } = await prepareStore(
      {},
      socket // Fork state manager's sagas
    )

    const factory = await getFactory(store)

    const community = (await factory.build<typeof communities.actions.storeCommunity>('Community')).payload

    store.dispatch(communities.actions.storeCommunity(community))
    store.dispatch(communities.actions.setCurrentCommunity(community.id))

    await factory.create<ReturnType<typeof identity.actions.storeIdentity>['payload']>('Identity', {
      id: community.id,
      nickname: 'alice',
      userCertificate: null,
      userCsr: null,
    })

    expect(store.getState().Identity.identities.entities[community.id]?.userCsr).toBeNull()

    renderComponent(
      <>
        <LoadingPanel />
        <CreateUsername />
      </>,
      store
    )

    // 'Create username' modal should be opened
    expect(screen.queryByTestId('createUsernameModalActions')).not.toBeNull()
    // Assertions that we don't see Loading Pannel
    expect(screen.queryByTestId('spinnerLoader')).toBeNull()
    // 'Create username' modal should be closed after creating csr
    store.dispatch(
      identity.actions.chooseUsername({
        nickname: 'alice',
      })
    )
    await waitFor(() => expect(screen.queryByTestId('createUsernameModalActions')).toBeNull())
  })
})
