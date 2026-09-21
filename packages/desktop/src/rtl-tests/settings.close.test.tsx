import React from 'react'
import '@testing-library/jest-dom/extend-expect'
import userEvent from '@testing-library/user-event'
import { act } from 'react-dom/test-utils'
import { fireEvent, screen, waitFor } from '@testing-library/dom'
import { Task } from 'redux-saga'
import MockedSocket from 'socket.io-mock'
import { call, fork } from 'typed-redux-saga'
import { FactoryGirl } from 'factory-girl'

import { getReduxStoreFactory, publicChannels, NotificationsSounds, Store } from '@quiet/state-manager'
import { MessageType, Community, Identity } from '@quiet/types'

import { ioMock } from '../shared/setupTests'
import { renderComponent } from '../renderer/testUtils/renderComponent'
import { prepareStore } from '../renderer/testUtils/prepareStore'
import Settings from '../renderer/components/Settings/Settings'
import SearchModal from '../renderer/components/SearchModal/SearchModal'
import { modalsActions } from '../renderer/sagas/modals/modals.slice'
import { modalsSelectors } from '../renderer/sagas/modals/modals.selectors'
import { ModalName } from '../renderer/sagas/modals/modals.types'
import { StoreState } from '../renderer/sagas/store.types'
import {
  createNotification,
  handleNotificationActions,
  NotificationData,
} from '../renderer/sagas/notifications/notifications.saga'

jest.setTimeout(20_000)

// renderer/index.tsx boots the Electron app (and imports CSS jest cannot parse); the Settings
// tree only needs `clearCommunity` from it.
jest.mock('../renderer', () => ({
  clearCommunity: jest.fn(),
}))

jest.mock('../shared/sounds', () => ({
  ...jest.requireActual('../shared/sounds'),
  soundTypeToAudio: {
    splat: { play: jest.fn() },
  },
}))

// @ts-expect-error jsdom does not implement the Notification API
window.Notification = jest.fn().mockImplementation(() => jest.fn())

const modalOpen = (store: Store, name: ModalName) =>
  modalsSelectors.open(name)(store.getState() as unknown as StoreState)

const isSettingsOpen = (store: Store) => modalOpen(store, ModalName.accountSettingsModal)

describe('Settings modal closes when the current channel changes', () => {
  let socket: MockedSocket

  let redux: {
    store: Store
    runSaga: (saga: any) => Task
  }
  let factory: FactoryGirl

  let community: Community
  let alice: Identity

  const channelFun = { name: 'fun', timestamp: 1673857606990 }
  const channelsMocks = [
    channelFun,
    { name: 'random', timestamp: 1673854900410 },
    { name: 'test', timestamp: 1673623514097 },
  ]

  beforeEach(async () => {
    socket = new MockedSocket()
    ioMock.mockImplementation(() => socket)
    window.ResizeObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }))

    redux = await prepareStore({}, socket)
    factory = await getReduxStoreFactory(redux.store)

    community = await factory.create('Community')

    alice = await factory.create('Identity', {
      communityId: community.id,
      nickname: 'alice',
    })

    for (const channelMock of channelsMocks) {
      await factory.create('PublicChannel', {
        channel: {
          name: channelMock.name,
          description: `Welcome to #${channelMock.name}`,
          timestamp: channelMock.timestamp,
          owner: alice.userId,
          id: channelMock.name,
        },
      })
    }
  })

  it('closes when a channel is picked in the search (Ctrl+K) modal', async () => {
    renderComponent(
      <>
        <Settings />
        <SearchModal />
      </>,
      redux.store
    )

    redux.store.dispatch(modalsActions.openModal({ name: ModalName.accountSettingsModal }))
    redux.store.dispatch(modalsActions.openModal({ name: ModalName.searchChannelModal }))

    expect(await screen.findByTestId('close-settings-button')).toBeVisible()

    const input = await screen.findByPlaceholderText('Channel name')
    await userEvent.type(input, channelFun.name)
    fireEvent.click(await screen.findByText('# fun'))

    await act(async () => {})

    expect(publicChannels.selectors.currentChannel(redux.store.getState())?.name).toEqual(channelFun.name)
    expect(isSettingsOpen(redux.store)).toBe(false)
    // The search modal still closes itself as before.
    expect(modalOpen(redux.store, ModalName.searchChannelModal)).toBe(false)
    await waitFor(() => expect(screen.queryByTestId('close-settings-button')).toBeNull())
  })

  it('closes when a new message notification is clicked', async () => {
    renderComponent(<Settings />, redux.store)

    // Start on another channel, then open Settings on top of it.
    redux.store.dispatch(publicChannels.actions.setCurrentChannel({ channelId: 'random' }))
    redux.store.dispatch(modalsActions.openModal({ name: ModalName.accountSettingsModal }))

    expect(await screen.findByTestId('close-settings-button')).toBeVisible()

    const notificationData: NotificationData = {
      label: 'label',
      body: 'body',
      channel: channelFun.name,
      sound: NotificationsSounds.splat,
    }

    await act(async () => {
      redux.runSaga(function* (): Generator {
        const notification = yield* call(createNotification, notificationData)
        yield* fork(handleNotificationActions, notification, MessageType.Basic, channelFun.name)
        const onClick = notification.onclick
        expect(onClick).not.toBeNull()
        if (onClick) yield* call(onClick, new Event(''))
      })
    })

    expect(publicChannels.selectors.currentChannelId(redux.store.getState())).toEqual(channelFun.name)
    expect(isSettingsOpen(redux.store)).toBe(false)
    await waitFor(() => expect(screen.queryByTestId('close-settings-button')).toBeNull())
  })

  it('stays closed when the channel is set while it was never opened', async () => {
    renderComponent(<Settings />, redux.store)

    expect(isSettingsOpen(redux.store)).toBe(false)

    redux.store.dispatch(publicChannels.actions.setCurrentChannel({ channelId: channelFun.name }))
    await act(async () => {})

    expect(isSettingsOpen(redux.store)).toBe(false)
    expect(screen.queryByTestId('close-settings-button')).toBeNull()
  })

  it('does not close unrelated modals', async () => {
    redux.store.dispatch(modalsActions.openModal({ name: ModalName.accountSettingsModal }))
    redux.store.dispatch(modalsActions.openModal({ name: ModalName.channelSettingsModal }))
    redux.store.dispatch(modalsActions.openModal({ name: ModalName.createChannel }))

    redux.store.dispatch(publicChannels.actions.setCurrentChannel({ channelId: channelFun.name }))
    await act(async () => {})

    expect(isSettingsOpen(redux.store)).toBe(false)
    expect(modalOpen(redux.store, ModalName.channelSettingsModal)).toBe(true)
    expect(modalOpen(redux.store, ModalName.createChannel)).toBe(true)
  })
})
