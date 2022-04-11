import React from 'react'
import '@testing-library/jest-dom/extend-expect'
import { act } from 'react-dom/test-utils'
import { screen } from '@testing-library/dom'
import { apply, take } from 'typed-redux-saga'
import MockedSocket from 'socket.io-mock'
import { ioMock } from '../shared/setupTests'
import { socketEventData } from '../renderer/testUtils/socket'
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
  messages
} from '@quiet/nectar'

import { keyFromCertificate, parseCertificate } from '@quiet/identity'

jest.setTimeout(20_000)

const notification = jest.fn().mockImplementation(() => {
  return jest.fn()
})
// @ts-expect-error
window.Notification = notification

jest.mock('electron', () => {
  return {
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
      socket // Fork Nectar's sagas
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
      socket // Fork Nectar's sagas
    )

    const factory = await getFactory(store)

    // const community = await factory.create<
    // ReturnType<typeof communitiesActions.addNewCommunity>['payload']
    // >('Community')

    const alice = await factory.create<
    ReturnType<typeof identity.actions.addNewIdentity>['payload']
    >('Identity', { nickname: 'alice' })

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

  it('asks for missing messages and displays them', async () => {
    const { store, runSaga } = await prepareStore(
      {},
      socket // Fork Nectar's sagas
    )

    const factory = await getFactory(store)

    const community = await factory.create<
    ReturnType<typeof communities.actions.addNewCommunity>['payload']
    >('Community')

    const alice = await factory.create<
    ReturnType<typeof identity.actions.addNewIdentity>['payload']
    >('Identity', { id: community.id, nickname: 'alice' })

    const aliceMessage = await factory.create<
    ReturnType<typeof publicChannels.actions.test_message>['payload']
    >('Message', {
      identity: alice,
      verifyAutomatically: true
    })

    // Data from below will build but it won't be stored
    const john = (
      await factory.build<typeof identity.actions.addNewIdentity>('Identity', {
        id: community.id,
        nickname: 'john'
      })
    ).payload

    const johnMessage = (
      await factory.build<typeof publicChannels.actions.test_message>('Message', {
        identity: john
      })
    ).payload

    renderComponent(
      <>
        <Channel />
      </>,
      store
    )

    jest.spyOn(socket, 'emit').mockImplementation((action: SocketActionTypes, ...input: any[]) => {
      if (action === SocketActionTypes.ASK_FOR_MESSAGES) {
        const data = (
          input as socketEventData<
          [
            {
              peerId: string
              channelAddress: string
              ids: string[]
              communityId: string
            }
          ]
          >
        )[0]
        if (data.ids.length > 1) {
          fail('Requested too many massages')
        }
        if (data.ids[0] !== johnMessage.message.id) {
          fail('Missing message has not been requested')
        }
        return socket.socketClient.emit(SocketActionTypes.INCOMING_MESSAGES, {
          messages: [johnMessage.message],
          communityId: data.communityId
        })
      }
    })

    // Log all the dispatched actions in order
    const actions = []
    runSaga(function* (): Generator {
      while (true) {
        const action = yield* take()
        actions.push(action.type)
      }
    })

    // Old message is already loaded
    const persistedMessage = await screen.findByText(aliceMessage.message.message)
    expect(persistedMessage).toBeVisible()

    // New message is not yet fetched from db
    expect(screen.queryByText(johnMessage.message.message)).toBeNull()

    await act(async () => {
      await runSaga(mockSendMessagesIds).toPromise()
    })

    // New message is displayed
    const newMessage = await screen.findByText(johnMessage.message.message)
    expect(newMessage).toBeVisible()

    expect(actions).toMatchInlineSnapshot(`
      Array [
        "PublicChannels/responseSendMessagesIds",
        "PublicChannels/askForMessages",
        "PublicChannels/incomingMessages",
        "PublicChannels/markUnreadMessages",
        "Messages/addPublicKeyMapping",
        "Messages/addMessageVerificationStatus",
      ]
    `)

    function* mockSendMessagesIds(): Generator {
      yield* apply(socket.socketClient, socket.socketClient.emit, [
        SocketActionTypes.SEND_MESSAGES_IDS,
        {
          peerId: alice.peerId.id,
          channelAddress: 'general',
          ids: [aliceMessage.message.id, johnMessage.message.id],
          communityId: community.id
        }
      ])
    }
  })

  it('filters out suspicious messages', async () => {
    const { store, runSaga } = await prepareStore(
      {},
      socket // Fork Nectar's sagas
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
      socket // Fork Nectar's sagas
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
      socket // Fork Nectar's sagas
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
    const spinner = screen.getByText('Fetching channel messages...')
    expect(spinner).toBeVisible()
  })

  it.skip("doesn't display messages loading spinner if there's at least one message", async () => {
    const { store } = await prepareStore(
      {},
      socket // Fork Nectar's sagas
    )

    const factory = await getFactory(store)

    const community = await factory.create<
    ReturnType<typeof communities.actions.addNewCommunity>['payload']
    >('Community')

    const alice = await factory.create<
    ReturnType<typeof identity.actions.addNewIdentity>['payload']
    >('Identity', { nickname: 'alice' })

    await factory.create<ReturnType<typeof publicChannels.actions.test_message>['payload']>(
      'Message',
      {
        identity: alice
      }
    )

    renderComponent(
      <>
        <Channel />
      </>,
      store
    )

    // Confirm there are messages to display
    const messages = publicChannels.selectors.currentChannelMessagesMergedBySender(store.getState())
    expect(Object.values(messages).length).toBe(1)

    // Verify loading spinner is not visible
    const spinner = await screen.queryByText('Fetching channel messages...')
    expect(spinner).toBeNull()
  })
})
