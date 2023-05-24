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
  connection
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
      disconnect: jest.fn()
    }))
  })

  it.skip('Displays loading panel before connecting websocket', async () => {
    // todo loading panel in other electron window

    const { store } = await prepareStore({
      [StoreKeys.Socket]: {
        ...new SocketState(),
        isConnected: false
      }
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

    const community = (await factory.build<typeof communities.actions.addNewCommunity>('Community'))
      .payload

    store.dispatch(communities.actions.addNewCommunity(community))
    store.dispatch(communities.actions.setCurrentCommunity(community.id))

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

    await factory.create<ReturnType<typeof identity.actions.addNewIdentity>['payload']>(
      'Identity',
      { id: community.id, nickname: 'alice' }
    )

    store.dispatch(communities.actions.addNewCommunity(community))
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

  it('Do not display Loading panel when community and identity are created but certificate is missing', async () => {
    const { store } = await prepareStore(
      {},
      socket // Fork state manager's sagas
    )

    const factory = await getFactory(store)

    const community = (await factory.build<typeof communities.actions.addNewCommunity>('Community'))
      .payload

    store.dispatch(communities.actions.addNewCommunity(community))
    store.dispatch(communities.actions.setCurrentCommunity(community.id))

    await factory.create<ReturnType<typeof identity.actions.addNewIdentity>['payload']>(
      'Identity',
      { id: community.id, nickname: 'alice' }
    )

    const aliceCertificate =
      store.getState().Identity.identities.entities[community.id]?.userCertificate

    expect(aliceCertificate).not.toBeUndefined()
    expect(aliceCertificate).not.toBeNull()

    store.dispatch(
      identity.actions.storeUserCertificate({
        communityId: community.id,
        // @ts-expect-error
        userCertificate: null
      })
    )

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
    // 'Create username' modal should be closed after receiving certificate
    store.dispatch(
      identity.actions.storeUserCertificate({
        communityId: community.id,
        // @ts-expect-error
        userCertificate: aliceCertificate
      })
    )
    await waitFor(() => expect(screen.queryByTestId('createUsernameModalActions')).toBeNull())
  })

  it('Display the loading panel until Tor is fully bootstrapped', async () => {
    const { store } = await prepareStore(
      {},
      socket // Fork state manager's sagas
    )

    renderComponent(
      <>
        <LoadingPanel />
      </>,
      store
    )

    expect(screen.getByTestId('startingPanelComponent')).toBeVisible()

    // 5%
    store.dispatch(
      connection.actions.setTorBootstrapProcess(
        'Apr 05 17:36:02.000 [notice] Bootstrapped 5% (conn): Connecting to a relay'
      )
    )
    await act(async () => {})
    const bootstrapped5text = screen.getByText('Tor Bootstrapped 5% (conn)')
    expect(bootstrapped5text).toBeVisible()

    // 50%
    store.dispatch(
      connection.actions.setTorBootstrapProcess(
        'Apr 05 17:36:08.000 [notice] Bootstrapped 50% (loading_descriptors): Loading relay descriptors'
      )
    )
    await act(async () => {})
    const bootstrapped50text = screen.getByText(
      'Tor Bootstrapped 50% (loading_descriptors)'
    )
    expect(bootstrapped50text).toBeVisible()

    // 95%
    store.dispatch(
      connection.actions.setTorBootstrapProcess(
        'Bootstrapped 95% (circuit_create): Establishing a Tor circuit'
      )
    )
    await act(async () => {})
    const bootstrapped95text = screen.getByText(
      'Tor Bootstrapped 95% (circuit_create)'
    )
    expect(bootstrapped95text).toBeVisible()

    // 100%
    store.dispatch(
      connection.actions.setTorBootstrapProcess(
        'Apr 05 17:36:10.000 [notice] Bootstrapped 100% (done): Done'
      )
    )
    await act(async () => {})
    const bootstrapped100text = screen.getByText('Tor Bootstrapped 100% (done)')
    expect(bootstrapped100text).toBeVisible()
  })
})
