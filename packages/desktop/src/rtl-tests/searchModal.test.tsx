import React from 'react'
import '@testing-library/jest-dom/extend-expect'
import userEvent from '@testing-library/user-event'
import { act } from 'react-dom/test-utils'
import { fireEvent, screen } from '@testing-library/dom'
import { Task } from 'redux-saga'
import MockedSocket from 'socket.io-mock'
import { ioMock } from '../shared/setupTests'
import { renderComponent } from '../renderer/testUtils/renderComponent'
import { prepareStore } from '../renderer/testUtils/prepareStore'

import {
  getFactory,
  identity,
  publicChannels,
  communities,
  Community,
  Identity,
  Store
} from '@quiet/state-manager'

import { FactoryGirl } from 'factory-girl'
import SearchModal from '../renderer/components/SearchModal/SearchModal'
import { modalsActions } from '../renderer/sagas/modals/modals.slice'
import { ModalName } from '../renderer/sagas/modals/modals.types'

jest.setTimeout(20_000)

jest.mock('electron', () => {
  return {
    ipcRenderer: { on: () => {}, send: jest.fn(), sendSync: jest.fn() },
    remote: {
      BrowserWindow: {
        getAllWindows: () => {
          return [
            {
              show: jest.fn(),
              isFocused: jest.fn()
            }
          ]
        }
      }
    }
  }
})

describe('Switch channels', () => {
  let socket: MockedSocket

  let redux: {
    store: Store
    runSaga: (saga: any) => Task
  }
  let factory: FactoryGirl

  let community: Community
  let alice: Identity

  const channelsMocks = [
    { name: 'fun', timestamp: 1673857606990 },
    { name: 'random', timestamp: 1673854900410 },
    { name: 'test', timestamp: 1673623514097 }
  ]

  beforeEach(async () => {
    socket = new MockedSocket()
    ioMock.mockImplementation(() => socket)
    window.ResizeObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn()
    }))

    redux = await prepareStore({}, socket)
    factory = await getFactory(redux.store)

    community = await factory.create<
      ReturnType<typeof communities.actions.addNewCommunity>['payload']
    >('Community')

    alice = await factory.create<ReturnType<typeof identity.actions.addNewIdentity>['payload']>(
      'Identity',
      { id: community.id, nickname: 'alice' }
    )

    // Automatically create channels
    for (const channelMock of channelsMocks) {
      await factory.create<ReturnType<typeof publicChannels.actions.addChannel>['payload']>(
        'PublicChannel',
        {
          channel: {
            name: channelMock.name,
            description: `Welcome to #${channelMock.name}`,
            timestamp: channelMock.timestamp,
            owner: alice.nickname,
            address: channelMock.name
          }
        }
      )
    }
  })

  it('Select channel by writing name and pressing enter', async () => {
    const CHANNEL_NAME = 'fun'
    renderComponent(
      <>
        <SearchModal />
      </>,
      redux.store
    )
    redux.store.dispatch(modalsActions.openModal({ name: ModalName.searchChannelModal }))

    const input = await screen.findByPlaceholderText('Channel name')
    await userEvent.type(input, channelsMocks.find(channel => channel.name === CHANNEL_NAME).name)
    const tab = await screen.findByText('# fun')
    await userEvent.type(tab, '{ArrowDown}')
    await userEvent.type(tab, '{enter}')

    await act(async () => {})

    const currentChannel = publicChannels.selectors.currentChannel(redux.store.getState())

    expect(currentChannel.name).toEqual(CHANNEL_NAME)
  })

  it('Select channel by writing name and clicking', async () => {
    const CHANNEL_NAME = 'fun'
    renderComponent(
      <>
        <SearchModal />
      </>,
      redux.store
    )
    redux.store.dispatch(modalsActions.openModal({ name: ModalName.searchChannelModal }))

    const input = await screen.findByPlaceholderText('Channel name')
    await userEvent.type(input, channelsMocks.find(channel => channel.name === CHANNEL_NAME).name)
    const tab = await screen.findByText('# fun')
    fireEvent.click(tab)

    await act(async () => {})

    const currentChannel = publicChannels.selectors.currentChannel(redux.store.getState())

    expect(currentChannel.name).toEqual(CHANNEL_NAME)
  })

  it('Select most recent channel by clicking arrow down and enter', async () => {
    const CHANNEL_NAME = 'fun'
    renderComponent(
      <>
        <SearchModal />
      </>,
      redux.store
    )
    redux.store.dispatch(modalsActions.openModal({ name: ModalName.searchChannelModal }))

    await act(async () => {
      await userEvent.tab()

      await userEvent.keyboard('[ArrowDown]')
      await userEvent.keyboard('[Enter]')
    })

    const currentChannel = publicChannels.selectors.currentChannel(redux.store.getState())

    expect(currentChannel.name).toEqual(CHANNEL_NAME)
  })

  it('Close by hitting escape', async () => {
    renderComponent(
      <>
        <SearchModal />
      </>,
      redux.store
    )
    redux.store.dispatch(modalsActions.openModal({ name: ModalName.searchChannelModal }))

    const text = await screen.findByText('recent channels')
    expect(text).toBeVisible()
    await userEvent.type(text, '{escape}')
    expect(text).not.toBeVisible()
  })
})
