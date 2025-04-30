import React from 'react'
import '@testing-library/jest-dom/extend-expect'
import { screen, waitFor } from '@testing-library/react'
import { renderComponent } from '../renderer/testUtils/renderComponent'
import { prepareStore } from '../renderer/testUtils/prepareStore'
import { StoreKeys } from '../renderer/store/store.keys'
import { socketActions, SocketState } from '../renderer/sagas/socket/socket.slice'
import LoadingPanel from '../renderer/components/LoadingPanel/LoadingPanel'
import MockedSocket from 'socket.io-mock'
import { ioMock } from '../shared/setupTests'
import {
  communities,
  connection,
  getReduxStoreFactory,
  getBaseTypesFactory,
  publicChannels,
  network,
  LoadingPanelType,
  identity,
} from '@quiet/state-manager'
import { DateTime } from 'luxon'
import { act } from '@testing-library/react'
import { modalsActions } from '../renderer/sagas/modals/modals.slice'
import { ModalName } from '../renderer/sagas/modals/modals.types'
import { createLogger } from './logger'
import { CommunityOwnership } from '@quiet/types'
import { channel } from 'diagnostics_channel'

const logger = createLogger('loadingPanel')

jest.setTimeout(20_000)
const mockNotification = jest.fn()
const notification = jest.fn().mockImplementation(() => {
  return mockNotification
})
// @ts-expect-error
window.Notification = notification

// TODO: update this test
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
    // TOOD: replace with real mock to fix initialized communities selector
  })

  it.skip('Displays loading panel before connecting websocket', async () => {
    // todo loading panel in other electron window
    logger.info('Displays loading panel before connecting websocket')
    const { store } = await prepareStore({
      [StoreKeys.Socket]: {
        ...new SocketState(),
        isConnected: false,
      },
    })
    logger.info('rendering component')
    renderComponent(
      <>
        <LoadingPanel />
      </>,
      store
    )

    // Verify loading panel is visible
    logger.info('Verify loading panel is visible')
    expect(screen.getByTestId('startingPanelComponent')).toBeVisible()

    // Verify proper messages is displayed
    logger.info('Verify proper messages is displayed')
    const startingApplicationMessage = screen.getByText(LoadingPanelType.StartingApplication)
    expect(startingApplicationMessage).toBeVisible()

    logger.info('Dispatching setConnected')
    store.dispatch(socketActions.setConnected())

    logger.info('Waiting for act')
    await act(async () => {})

    // Verify loading panel disappeared
    logger.info('Verify starting panel disappeared')
    expect(screen.queryByTestId('startingPanelComponent')).toBeNull()
  })

  it('Displays loading panel between registering username and replicating data', async () => {
    logger.info('Displays loading panel between registering username and replicating data')
    const { store } = await prepareStore(
      {},
      socket // Fork state manager's sagas
    )

    const factory = await getReduxStoreFactory(store)

    // creates community but does not set create initial messages or initalized status
    const community = await factory.create('Community', {
      ownership: CommunityOwnership.User,
    })
    const owner = await factory.create('Identity', {
      communityId: community.id,
    })

    await act(async () => {
      store.dispatch(network.actions.setLoadingPanelType(LoadingPanelType.Joining))
    })
    await act(async () => {
      store.dispatch(modalsActions.openModal({ name: ModalName.loadingPanel }))
    })

    await act(async () => {
      renderComponent(
        <>
          <LoadingPanel />
        </>,
        store
      )
    })
    // Verify loading panel is visible
    logger.info('Verify loading panel is visible')
    expect(screen.getByTestId('joiningPanelComponent')).toBeVisible()

    // Verify proper messages is displayed
    logger.info('Verify proper messages is displayed')
    const startingApplicationMessage = screen.getByText('Joining now!')
    expect(startingApplicationMessage).toBeVisible()

    // Satisfy joining conditions
    await act(async () => {
      store.dispatch(network.actions.addInitializedCommunity(community.id))
    })
    const generalChannelId = publicChannels.selectors.currentChannel(store.getState())
    const userId = identity.selectors.currentIdentity(store.getState())!.userId
    const baseTypeFactory = await getBaseTypesFactory()
    const channelMessage = await baseTypeFactory.create('ChannelMessage', {
      channelId: generalChannelId!.id,
      userId: userId,
    })
    const message = await factory.create('TestMessage', { message: channelMessage })

    // Verify that isJoiningCompletedSelector is now true
    logger.info('Verify that isJoiningCompletedSelector is now true')
    await waitFor(
      () => {
        const isJoiningCompletedSelector = connection.selectors.isJoiningCompleted(store.getState())
        expect(isJoiningCompletedSelector).toBe(true)
      },
      { timeout: 2_000 }
    )
    // logger.info('Dispatching closeModal done')
    // await act(async () => {
    //   store.dispatch(modalsActions.closeModal(ModalName.loadingPanel))
    // })

    // Verify loading panel dissapeared
    expect(screen.queryByTestId('joiningPanelComponent')).toBeNull()
  })
})
