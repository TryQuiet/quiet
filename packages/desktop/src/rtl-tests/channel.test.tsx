import React from 'react'
import '@testing-library/jest-dom/extend-expect'
import { act } from 'react-dom/test-utils'
import { screen } from '@testing-library/dom'
import { apply, take } from 'typed-redux-saga'
import userEvent from '@testing-library/user-event'
import MockedSocket from 'socket.io-mock'
import { ioMock } from '../shared/setupTests'
import { renderComponent } from '../renderer/testUtils/renderComponent'
import { prepareStore } from '../renderer/testUtils/prepareStore'
import Channel from '../renderer/components/Channel/Channel'

import {
  identity,
  communities,
  publicChannels,
  getFactory,
  SocketActionTypes,
  ChannelMessage,
  messages,
  SendingStatus,
  MessageType,
  connection
} from '@quiet/state-manager'

import { keyFromCertificate, parseCertificate } from '@quiet/identity'

import { fetchingChannelMessagesText } from '../renderer/components/widgets/channels/ChannelMessages'

jest.setTimeout(20_000)

const notification = jest.fn().mockImplementation(() => {
  return jest.fn()
})
// @ts-expect-error
window.Notification = notification

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

jest.mock('../shared/sounds', () => ({
  // @ts-expect-error
  ...jest.requireActual('../shared/sounds'),
  soundTypeToAudio: {
    pow: {
      play: jest.fn()
    }
  }
}))

describe('Channel', () => {
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

  it("causes no error if there's no data yet", async () => {
    const { store } = await prepareStore(
      {},
      socket // Fork state manager's sagas
    )

    renderComponent(
      <>
        <Channel />
      </>,
      store
    )

    const channelName = screen.queryByText('#')
    expect(channelName).toBeNull()
  })

  it('displays properly on app (re)start', async () => {
    const { store } = await prepareStore(
      {},
      socket // Fork state manager's sagas
    )

    const factory = await getFactory(store)

    // const community = await factory.create<
    // ReturnType<typeof communitiesActions.addNewCommunity>['payload']
    // >('Community')

    const alice = await factory.create<
    ReturnType<typeof identity.actions.addNewIdentity>['payload']
    >('Identity', { nickname: 'alice' })

    window.HTMLElement.prototype.scrollTo = jest.fn()

    renderComponent(
      <>
        <Channel />
      </>,
      store
    )

    const channelName = screen.getByText('#general')
    expect(channelName).toBeVisible()

    const messageInput = screen.getByPlaceholderText(`Message #general as @${alice.nickname}`)
    expect(messageInput).toBeVisible()
  })

  it('filters out suspicious messages', async () => {
    const { store, runSaga } = await prepareStore(
      {},
      socket // Fork state manager's sagas
    )

    const factory = await getFactory(store)

    const community = await factory.create<
    ReturnType<typeof communities.actions.addNewCommunity>['payload']
    >('Community')

    const alice = await factory.create<
    ReturnType<typeof identity.actions.addNewIdentity>['payload']
    >('Identity', { id: community.id, nickname: 'alice' })

    const john = await factory.create<
    ReturnType<typeof identity.actions.addNewIdentity>['payload']
    >('Identity', { id: community.id, nickname: 'john' })

    const johnPublicKey = keyFromCertificate(parseCertificate(john.userCertificate))

    const authenticMessage: ChannelMessage = {
      ...(
        await factory.build<typeof publicChannels.actions.test_message>('Message', {
          identity: alice
        })
      ).payload.message,
      id: Math.random().toString(36).substr(2.9)
    }

    const spoofedMessage: ChannelMessage = {
      ...(
        await factory.build<typeof publicChannels.actions.test_message>('Message', {
          identity: alice
        })
      ).payload.message,
      id: Math.random().toString(36).substr(2.9),
      pubKey: johnPublicKey
    }

    window.HTMLElement.prototype.scrollTo = jest.fn()

    renderComponent(
      <>
        <Channel />
      </>,
      store
    )

    await act(async () => {
      await runSaga(mockIncomingMessages).toPromise()
    })

    // Verified message is shown
    const persistedMessage = await screen.findByText(authenticMessage.message)
    expect(persistedMessage).toBeVisible()

    // Spoofed message doesn't exist
    expect(screen.queryByText(spoofedMessage.message)).toBeNull()

    function* mockIncomingMessages(): Generator {
      yield* apply(socket.socketClient, socket.socketClient.emit, [
        SocketActionTypes.INCOMING_MESSAGES,
        {
          messages: [authenticMessage, spoofedMessage],
          communityId: community.id
        }
      ])
    }
  })

  it('validates and displays persisted messages even if verification status cache is invalid', async () => {
    const { store, runSaga } = await prepareStore(
      {},
      socket // Fork state manager's sagas
    )

    const factory = await getFactory(store)

    const community = await factory.create<
    ReturnType<typeof communities.actions.addNewCommunity>['payload']
    >('Community')

    const alice = await factory.create<
    ReturnType<typeof identity.actions.addNewIdentity>['payload']
    >('Identity', { id: community.id, nickname: 'alice' })

    const aliceMessage = (
      await factory.build<typeof publicChannels.actions.test_message>('Message', {
        identity: alice
      })
    ).payload.message

    store.dispatch(
      messages.actions.addPublicKeyMapping({
        publicKey: aliceMessage.pubKey,
        cryptoKey: undefined
      })
    )

    window.HTMLElement.prototype.scrollTo = jest.fn()

    renderComponent(
      <>
        <Channel />
      </>,
      store
    )

    await act(async () => {
      await runSaga(mockIncomingMessages).toPromise()
    })

    // Mssage is shown
    const persistedMessage = await screen.findByText(aliceMessage.message)
    expect(persistedMessage).toBeVisible()

    function* mockIncomingMessages(): Generator {
      yield* apply(socket.socketClient, socket.socketClient.emit, [
        SocketActionTypes.INCOMING_MESSAGES,
        {
          messages: [aliceMessage],
          communityId: community.id
        }
      ])
    }
  })

  it("displays messages loading spinner if there's no messages", async () => {
    const { store } = await prepareStore(
      {},
      socket // Fork state manager's sagas
    )

    const factory = await getFactory(store)

    await factory.create<ReturnType<typeof communities.actions.addNewCommunity>['payload']>(
      'Community'
    )

    renderComponent(
      <>
        <Channel />
      </>,
      store
    )

    // Confirm there are no messages to display
    const messages = publicChannels.selectors.currentChannelMessagesMergedBySender(store.getState())
    expect(Object.values(messages).length).toBe(0)

    // Verify loading spinner is visible
    const spinner = screen.getByText(fetchingChannelMessagesText)
    expect(spinner).toBeVisible()
  })

  it("doesn't display messages loading spinner if there's at least one message", async () => {
    const { store } = await prepareStore(
      {},
      socket // Fork state manager's sagas
    )

    const factory = await getFactory(store)

    const community = await factory.create<
    ReturnType<typeof communities.actions.addNewCommunity>['payload']
    >('Community')

    const alice = await factory.create<
    ReturnType<typeof identity.actions.addNewIdentity>['payload']
    >('Identity', { id: community.id, nickname: 'alice' })

    await factory.create<ReturnType<typeof publicChannels.actions.test_message>['payload']>(
      'Message',
      {
        identity: alice,
        verifyAutomatically: true
      }
    )

    window.HTMLElement.prototype.scrollTo = jest.fn()

    renderComponent(
      <>
        <Channel />
      </>,
      store
    )

    await act(async () => {})

    // Confirm there are messages to display
    const messages = publicChannels.selectors.currentChannelMessagesMergedBySender(store.getState())
    expect(Object.values(messages).length).toBe(1)

    // Verify loading spinner is not visible
    const spinner = await screen.queryByText(fetchingChannelMessagesText)
    expect(spinner).toBeNull()
  })

  it('immediately display greyed out message after sending, then turn it black when saved to db', async () => {
    const { store, runSaga } = await prepareStore(
      {},
      socket // Fork state manager's sagas
    )

    const factory = await getFactory(store)

    const community = await factory.create<
    ReturnType<typeof communities.actions.addNewCommunity>['payload']
    >('Community')

    const alice = await factory.create<
    ReturnType<typeof identity.actions.addNewIdentity>['payload']
    >('Identity', { id: community.id, nickname: 'alice' })

    window.HTMLElement.prototype.scrollTo = jest.fn()

    renderComponent(
      <>
        <Channel />
      </>,
      store
    )

    const messageText = 'Hello!'

    store.dispatch(messages.actions.sendMessage({ message: messageText }))

    await act(async () => {})

    // Get sent message for further assertions
    const sentMessage = publicChannels.selectors.currentChannelMessages(store.getState())[0]

    // Confirm message has been stored immediately
    const displayableMessages = publicChannels.selectors.currentChannelMessagesMergedBySender(
      store.getState()
    )
    expect(Object.values(displayableMessages).length).toBe(1)

    // Verify message status is 'pending'
    expect(messages.selectors.messagesSendingStatus(store.getState())[sentMessage.id].status).toBe(
      SendingStatus.Pending
    )

    // Verify message is greyed out
    expect(await screen.findByText(messageText)).toHaveStyle('color:#B2B2B2')

    // Update message sending status
    store.dispatch(
      messages.actions.incomingMessages({
        messages: [sentMessage],
        communityId: community.id
      })
    )

    await act(async () => {
      await runSaga(mockIncomingMessages).toPromise()
    })

    function* mockIncomingMessages(): Generator {
      yield* apply(socket.socketClient, socket.socketClient.emit, [
        SocketActionTypes.INCOMING_MESSAGES,
        {
          messages: [sentMessage],
          communityId: community.id
        }
      ])
    }

    // Confirm 'pending' message status has been removed
    expect(messages.selectors.messagesSendingStatus(store.getState())[sentMessage.id]).toBe(
      undefined
    )

    // Confirm message is no longer greyed out
    expect(await screen.findByText(messageText)).toBeVisible()
    expect(await screen.findByText(messageText)).not.toHaveStyle('color:#B2B2B2')
  })

  it("shows incoming message if it's not older than oldest message, and isn't the newest one", async () => {
    const { store, runSaga } = await prepareStore(
      {},
      socket // Fork state manager's sagas
    )

    const factory = await getFactory(store)

    const community = await factory.create<
    ReturnType<typeof communities.actions.addNewCommunity>['payload']
    >('Community')

    const alice = await factory.create<
    ReturnType<typeof identity.actions.addNewIdentity>['payload']
    >('Identity', { id: community.id, nickname: 'alice' })

    window.HTMLElement.prototype.scrollTo = jest.fn()

    renderComponent(
      <>
        <Channel />
      </>,
      store
    )

    const messagesText = ['message1', 'message2', 'message3']
    const messages: ChannelMessage[] = []

    for (const msg of messagesText) {
      const message = (
        await factory.build<typeof publicChannels.actions.test_message>('Message', {
          identity: alice,
          message: {
            id: Math.random().toString(36).substr(2.9),
            type: MessageType.Basic,
            message: msg,
            createdAt: messagesText.indexOf(msg) + 1,
            channelAddress: 'general',
            signature: '',
            pubKey: ''
          },
          verifyAutomatically: true
        })
      ).payload.message
      messages.push(message)
    }

    const [message1, message2, message3] = messages

    await act(async () => {
      console.log('runSaga')
      await runSaga(mockIncomingMessages).toPromise()
    })

    function* mockIncomingMessages(): Generator {
      console.log('mockIncomingMessage')
      yield* apply(socket.socketClient, socket.socketClient.emit, [
        SocketActionTypes.INCOMING_MESSAGES,
        {
          messages: [message3],
          communityId: community.id
        }
      ])
      yield* apply(socket.socketClient, socket.socketClient.emit, [
        SocketActionTypes.INCOMING_MESSAGES,
        {
          messages: [message1],
          communityId: community.id
        }
      ])
      yield* apply(socket.socketClient, socket.socketClient.emit, [
        SocketActionTypes.INCOMING_MESSAGES,
        {
          messages: [message2],
          communityId: community.id
        }
      ])
    }

    expect(await screen.findByText(message1.message)).toBeVisible()
    expect(await screen.findByText(message2.message)).toBeVisible()
    expect(await screen.findByText(message3.message)).toBeVisible()
  })

  // TODO: https://github.com/TryQuiet/monorepo/issues/530
  it.skip('allow to type and send message if community is initialized', async () => {
    const { store, runSaga } = await prepareStore(
      {},
      socket // Fork state manager's sagas
    )

    const factory = await getFactory(store)

    const community = await factory.create<
    ReturnType<typeof communities.actions.addNewCommunity>['payload']
    >('Community')

    const alice = await factory.create<
    ReturnType<typeof identity.actions.addNewIdentity>['payload']
    >('Identity', { id: community.id, nickname: 'alice' })

    window.HTMLElement.prototype.scrollTo = jest.fn()

    renderComponent(
      <>
        <Channel />
      </>,
      store
    )

    await act(async () => {
      store.dispatch(connection.actions.addInitializedCommunity(community.id))
    })

    // Log all the dispatched actions in order
    const actions = []
    runSaga(function* (): Generator {
      while (true) {
        const action = yield* take()
        actions.push(action.type)
      }
    })

    const messageInput = screen.getByPlaceholderText(`Message #general as @${alice.nickname}`)

    // This input loses the first letter, hence the next assertion looks for a string without that.
    userEvent.type(messageInput, 'hhello')

    const isTextVisible = screen.getByText('hello')

    expect(isTextVisible).toBeTruthy()

    userEvent.type(messageInput, '{enter}')

    // sendMessage action trigger
    expect(actions).toMatchInlineSnapshot(`
      Array [
        "Messages/sendMessage",
      ]
    `)
  })

  it("doesn't allow to type and send message if community is not initialized", async () => {
    const { store, runSaga } = await prepareStore(
      {},
      socket // Fork state manager's sagas
    )

    const factory = await getFactory(store)

    const community = await factory.create<
    ReturnType<typeof communities.actions.addNewCommunity>['payload']
    >('Community')

    const alice = await factory.create<
    ReturnType<typeof identity.actions.addNewIdentity>['payload']
    >('Identity', { id: community.id, nickname: 'alice' })

    window.HTMLElement.prototype.scrollTo = jest.fn()

    renderComponent(
      <>
        <Channel />
      </>,
      store
    )

    // Log all the dispatched actions in order
    const actions = []
    runSaga(function* (): Generator {
      while (true) {
        const action = yield* take()
        actions.push(action.type)
      }
    })

    const infoMessage = screen.getByText('Initializing community. This may take a few minutes...')
    expect(infoMessage).toBeVisible()

    const messageInput = screen.getByPlaceholderText(`Message #general as @${alice.nickname}`)

    // This input loses the first letter, hence the next assertion looks for a string without that.
    userEvent.type(messageInput, 'hhello')

    expect(await screen.queryByText('hello')).toBeNull()

    userEvent.type(messageInput, '{enter}')

    // sendMessage action does not trigger
    expect(actions).toMatchInlineSnapshot('Array []')
  })
})
