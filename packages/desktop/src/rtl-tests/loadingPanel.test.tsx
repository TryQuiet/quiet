import React from 'react'
import '@testing-library/jest-dom/extend-expect'
import { fireEvent, screen, waitFor } from '@testing-library/react'
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
  errors,
} from '@quiet/state-manager'
import { DateTime } from 'luxon'
import { act } from '@testing-library/react'
import { modalsActions } from '../renderer/sagas/modals/modals.slice'
import { ModalName } from '../renderer/sagas/modals/modals.types'
import { createLogger } from './logger'
import {
  CommunityOwnership,
  ErrorMessages,
  InvitationDataVersion,
  InvitationKind,
  LoadingPanelType as SharedLoadingPanelType,
  SocketActions,
} from '@quiet/types'
import { channel } from 'diagnostics_channel'
import { createStore } from 'redux'
import { rootReducer } from '../renderer/store/reducers'
import { persistor } from '../renderer/store/persistor'
import JoinCommunity from '../renderer/components/CreateJoinCommunity/JoinCommunity/JoinCommunity'

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
      store.dispatch(connection.actions.setTorInitialized())
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

  it('requests backend cleanup before clearing an invalid provisional device link', async () => {
    const { store } = await prepareStore()
    const factory = await getReduxStoreFactory(store)
    const community = await factory.create('Community', {
      ownership: CommunityOwnership.User,
      inviteData: {
        kind: InvitationKind.Device,
        version: InvitationDataVersion.v4,
        pairs: [],
        psk: 'credential-psk',
        authData: {
          communityName: 'Linked community',
          seed: 'credential-seed',
          teamId: 'team-id',
          userId: 'user-id',
          userName: 'Alice',
        },
      },
    })
    store.dispatch(network.actions.setLoadingPanelType(SharedLoadingPanelType.Failed))
    store.dispatch(
      errors.actions.addError({
        type: SocketActions.LAUNCH_COMMUNITY,
        message: ErrorMessages.INVALID_INVITE,
        community: community.id,
      })
    )
    const dispatchSpy = jest.spyOn(store, 'dispatch')

    renderComponent(<LoadingPanel />, store)

    await waitFor(() => {
      expect(dispatchSpy).toHaveBeenCalledWith(communities.actions.resetAdmission(community.id))
    })
    expect(communities.selectors.currentCommunity(store.getState())).toEqual(
      expect.objectContaining({ id: community.id })
    )
    expect(dispatchSpy).not.toHaveBeenCalledWith(communities.actions.resetApp(undefined))
  })

  it('shows a retry action when backend admission cleanup fails', async () => {
    const { store } = await prepareStore()
    const factory = await getReduxStoreFactory(store)
    const community = await factory.create('Community', { ownership: CommunityOwnership.User })
    store.dispatch(network.actions.setLoadingPanelType(SharedLoadingPanelType.Failed))
    store.dispatch(communities.actions.setAdmissionResetStatus('failed'))
    const dispatchSpy = jest.spyOn(store, 'dispatch')

    renderComponent(<LoadingPanel />, store)
    fireEvent.click(screen.getByTestId('retry-admission-reset'))

    expect(dispatchSpy).toHaveBeenCalledWith(communities.actions.resetAdmission(community.id))
  })

  it('shows pending receipt cleanup instead of the starting panel without a community entity', () => {
    const store = createStore(rootReducer)
    store.dispatch(communities.actions.setCurrentCommunity('receipt-community'))
    store.dispatch(communities.actions.setAdmissionResetStatus('pending'))

    renderComponent(<LoadingPanel />, store)

    expect(screen.getByTestId('joiningPanelComponent')).toBeVisible()
    expect(screen.queryByTestId('startingPanelComponent')).not.toBeInTheDocument()
  })

  it('retries failed receipt cleanup by ID without a community entity', async () => {
    const store = createStore(rootReducer)
    store.dispatch(communities.actions.setCurrentCommunity('receipt-community'))
    store.dispatch(communities.actions.setAdmissionResetStatus('failed'))
    store.dispatch(modalsActions.closeModal(ModalName.loadingPanel))
    store.dispatch(modalsActions.openModal({ name: ModalName.joinCommunityModal }))
    const dispatchSpy = jest.spyOn(store, 'dispatch')

    renderComponent(<LoadingPanel />, store)
    await waitFor(() => expect(screen.getByTestId('joiningPanelComponent')).toBeVisible())
    expect(dispatchSpy).toHaveBeenCalledWith(modalsActions.closeModal(ModalName.joinCommunityModal))
    expect(dispatchSpy).toHaveBeenCalledWith(modalsActions.openModal({ name: ModalName.loadingPanel }))
    fireEvent.click(screen.getByTestId('retry-admission-reset'))

    expect(dispatchSpy).toHaveBeenCalledWith(communities.actions.resetAdmission('receipt-community'))
  })

  it('keeps final persistence failure visible after the root state reset', async () => {
    const store = createStore(rootReducer)
    const result = { type: 'invalid' as const }
    store.dispatch(communities.actions.setAdmissionResetResult(result))
    store.dispatch(communities.actions.setAdmissionResetStatus('complete'))
    const flush = jest
      .spyOn(persistor, 'flush')
      .mockRejectedValueOnce(new Error('disk unavailable'))
      .mockResolvedValueOnce(undefined as never)

    renderComponent(<LoadingPanel />, store)

    expect(await screen.findByText('Couldn’t reset the failed link')).toBeVisible()
    expect(screen.getByText(/could not save the updated app state/)).toBeVisible()
    expect(communities.selectors.admissionResetStatus(store.getState())).toBe('finalizing')
    fireEvent.click(screen.getByTestId('retry-admission-reset'))
    await waitFor(() => expect(flush).toHaveBeenCalledTimes(2))
    await waitFor(() => {
      expect(communities.selectors.admissionResetStatus(store.getState())).toBe('idle')
    })
    flush.mockRestore()
  })

  it('shows the invalid invite error after reset finalization reopens Join Community', async () => {
    const store = createStore(rootReducer)
    store.dispatch(socketActions.setConnected())
    store.dispatch(modalsActions.openModal({ name: ModalName.loadingPanel }))
    store.dispatch(communities.actions.setAdmissionResetResult({ type: 'invalid' }))
    store.dispatch(communities.actions.setAdmissionResetStatus('complete'))
    let resolveFlush: (() => void) | undefined
    const pendingFlush = new Promise<void>(resolve => {
      resolveFlush = resolve
    })
    const flush = jest.spyOn(persistor, 'flush').mockReturnValue(pendingFlush as never)

    renderComponent(
      <>
        <LoadingPanel />
        <JoinCommunity />
      </>,
      store
    )

    await waitFor(() => {
      expect(communities.selectors.admissionResetStatus(store.getState())).toBe('finalizing')
    })
    expect(screen.queryByPlaceholderText('Link')).not.toBeInTheDocument()

    await act(async () => resolveFlush?.())

    expect(await screen.findByText(ErrorMessages.INVALID_INVITE)).toBeVisible()
    expect(communities.selectors.currentCommunity(store.getState())).toBeUndefined()
    expect(communities.selectors.joinCommunityError(store.getState())).toEqual({ type: 'invalid' })
    expect(communities.selectors.admissionResetStatus(store.getState())).toBe('idle')
    flush.mockRestore()
  })
})
