import React from 'react'
import '@testing-library/jest-dom/extend-expect'
import userEvent from '@testing-library/user-event'
import { act } from 'react-dom/test-utils'
import { screen } from '@testing-library/dom'
import { apply } from 'typed-redux-saga'
import { Task } from 'redux-saga'
import MockedSocket from 'socket.io-mock'
import { ioMock } from '../shared/setupTests'
import { renderComponent } from '../renderer/testUtils/renderComponent'
import { prepareStore } from '../renderer/testUtils/prepareStore'

import Sidebar from '../renderer/components/Sidebar/Sidebar'
import Channel from '../renderer/components/Channel/Channel'

import {
  getFactory,
  identity,
  publicChannels,
  communities,
  Community,
  Identity,
  Store,
  SocketActionTypes,
  MessageType,
  ChannelMessage,
  messages
} from '@quiet/state-manager'

import { FactoryGirl } from 'factory-girl'
import { DateTime } from 'luxon'

import store from '../renderer/store'

jest.setTimeout(20_000)
jest.mock('electron', () => {
  return {
    ipcRenderer: { on: () => {}, send: jest.fn(), sendSync: jest.fn() },
    remote:
    {
      BrowserWindow: {
        getAllWindows: () => {
          return [{
            show: jest.fn(),
            isFocused: jest.fn()
          }]
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

    const channelNames = ['memes', 'pets', 'travels']

    // Automatically create channels
    for (const name of channelNames) {
      await factory.create<ReturnType<typeof publicChannels.actions.addChannel>['payload']>(
        'PublicChannel',
        {
          channel: {
            name: name,
            description: `Welcome to #${name}`,
            timestamp: DateTime.utc().valueOf(),
            owner: alice.nickname,
            address: name
          }
        }
      )
    }
  })

  it('Opens another channel', async () => {
    const generalChannelMessage = await factory.create<
    ReturnType<typeof publicChannels.actions.test_message>['payload']
    >('Message', { identity: alice, verifyAutomatically: true })

    window.HTMLElement.prototype.scrollTo = jest.fn()

    renderComponent(
      <>
        <Sidebar />
        <Channel />
      </>,
      redux.store
    )

    // Check if defaultly selected channel is #general
    const channelTitle = screen.getByTestId('channelTitle')
    expect(channelTitle).toHaveTextContent('#general')

    // Check if message is visible within the channel page
    let message = screen.getByText(generalChannelMessage.message.message)
    expect(message).toBeVisible()

    // Select another channel
    const memesChannelLink = screen.getByTestId('memes-link')
    await userEvent.click(memesChannelLink)
    // Confirm selected channel has changed
    expect(screen.getByTestId('channelTitle')).toHaveTextContent('#memes')
    // Confirm the message from #general channel is no longer visible
    expect(message).not.toBeVisible()

    // Go back to #general channel
    const generalChannelLink = screen.getByTestId('general-link')
    await userEvent.click(generalChannelLink)
    // Confirm selected channel has changed
    expect(screen.getByTestId('channelTitle')).toHaveTextContent('#general')
    // Confirm the message from #general channel is visible back again
    message = screen.getByText(generalChannelMessage.message.message)
    expect(message).toBeVisible()
  })

  it('Highlights channel with unread messages and removes the highlight when entered', async () => {
    const messagesAddresses = ['memes', 'pets']
    const messages: ChannelMessage[] = []

    // Automatically create messages
    for (const address of messagesAddresses) {
      const message = (
        await factory.build<typeof publicChannels.actions.test_message>('Message', {
          identity: alice,
          message: {
            id: Math.random().toString(36).substr(2.9),
            type: MessageType.Basic,
            message: 'message',
            createdAt: DateTime.utc().valueOf(),
            channelAddress: address,
            signature: '',
            pubKey: ''
          },
          verifyAutomatically: true
        })
      ).payload.message
      messages.push(message)
    }

    renderComponent(
      <>
        <Sidebar />
      </>,
      redux.store
    )

    // Set 'general' as active channel
    store.dispatch(publicChannels.actions.setCurrentChannel({
      channelAddress: 'general'
    }))

    // Assert channel is not highglighted
    const memesChannelLink = screen.getByTestId('memes-link-text')
    expect(memesChannelLink).toHaveStyle('opacity: 0.7')

    await act(async () => {
      await redux.runSaga(mockIncomingMessages).toPromise()
    })

    // Verify proper channel shows unread messages information
    expect(memesChannelLink).toHaveStyle('opacity: 1')
    // Confirm 'read' channel hasn't changed
    const travelsChannelLink = screen.getByTestId('travels-link-text')
    expect(travelsChannelLink).toHaveStyle('opacity: 0.7')

    // Enter channel and confirm highlight dissapeared
    await userEvent.click(memesChannelLink)
    expect(memesChannelLink).toHaveStyle('opacity: 0.7')
    // Confirm the other 'unread' channel is still highlighted
    const petsChannelLink = screen.getByTestId('pets-link-text')
    expect(petsChannelLink).toHaveStyle('opacity: 1')

    function* mockIncomingMessages(): Generator {
      yield* apply(socket.socketClient, socket.socketClient.emit, [
        SocketActionTypes.INCOMING_MESSAGES,
        {
          messages: messages,
          communityId: community.id
        }
      ])
    }
  })

  it('Does not show information about unread messages if channel is active', async () => {
    const message = (
      await factory.build<typeof publicChannels.actions.test_message>('Message', {
        identity: alice,
        message: {
          id: Math.random().toString(36).substr(2.9),
          type: MessageType.Basic,
          message: 'message',
          createdAt: DateTime.utc().valueOf(),
          channelAddress: 'general',
          signature: '',
          pubKey: ''
        },
        verifyAutomatically: true
      })
    ).payload.message

    renderComponent(
      <>
        <Sidebar />
      </>,
      redux.store
    )

    const generalChannelLink = screen.getByTestId('general-link')
    const generalChannelLinkText = screen.getByTestId('general-link-text')

    // Assert channel is selected and not highglighted
    expect(generalChannelLink).toHaveStyle('backgroundColor: rgb(103, 191, 211)') // lushSky: '#67BFD3'
    expect(generalChannelLinkText).toHaveStyle('opacity: 0.7')

    await act(async () => {
      await redux.runSaga(mockIncomingMessages).toPromise()
    })

    // Confirm nothing changed
    expect(generalChannelLink).toHaveStyle('backgroundColor: rgb(103, 191, 211)')
    expect(generalChannelLinkText).toHaveStyle('opacity: 0.7')

    function* mockIncomingMessages(): Generator {
      yield* apply(socket.socketClient, socket.socketClient.emit, [
        SocketActionTypes.INCOMING_MESSAGES,
        {
          messages: [message],
          communityId: community.id
        }
      ])
    }
  })

  it('Loads messages to cache when switching channel', async () => {
    const message = (
      await factory.build<typeof publicChannels.actions.test_message>('Message', {
        identity: alice,
        message: {
          id: Math.random().toString(36).substr(2.9),
          type: MessageType.Basic,
          message: 'message',
          createdAt: DateTime.utc().valueOf(),
          channelAddress: 'travels',
          signature: '',
          pubKey: ''
        },
        verifyAutomatically: true
      })
    ).payload.message

    window.HTMLElement.prototype.scrollTo = jest.fn()

    renderComponent(
      <>
        <Sidebar />
        <Channel />
      </>,
      redux.store
    )

    // Set 'general' as active channel
    store.dispatch(publicChannels.actions.setCurrentChannel({
      channelAddress: 'general'
    }))

    // Assert channel is not highglighted
    const travelsChannelLink = screen.getByTestId('travels-link-text')
    expect(travelsChannelLink).toHaveStyle('opacity: 0.7')

    await act(async () => {
      await redux.runSaga(mockIncomingMessages).toPromise()
    })

    // Verify proper channel shows unread messages information
    expect(travelsChannelLink).toHaveStyle('opacity: 1')

    // Enter channel and confirm highlight dissapeared
    await userEvent.click(travelsChannelLink)
    expect(travelsChannelLink).toHaveStyle('opacity: 0.7')

    // Verify replicated message in present in repository
    expect(messages.selectors.validCurrentPublicChannelMessagesEntries(redux.store.getState())[0]).toStrictEqual(message)
    // Verify replicated messages was placed in cache
    expect(publicChannels.selectors.currentChannelMessages(redux.store.getState())[0]).toStrictEqual(message)

    // Confirm new message was properly cached and is visible
    expect(await screen.findByText(message.message)).toBeVisible()

    function* mockIncomingMessages(): Generator {
      yield* apply(socket.socketClient, socket.socketClient.emit, [
        SocketActionTypes.INCOMING_MESSAGES,
        {
          messages: [message],
          communityId: community.id,
          isVerified: true
        }
      ])
    }
  })
})
