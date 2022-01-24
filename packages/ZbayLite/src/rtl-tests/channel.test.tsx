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

import Channel from '../renderer/containers/pages/Channel'

import {
  identity,
  communities,
  publicChannels,
  getFactory,
  SocketActionTypes
} from '@zbayapp/nectar'

describe('Channel', () => {
  let socket: MockedSocket

  beforeEach(() => {
    socket = new MockedSocket()
    ioMock.mockImplementation(() => socket)
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
    >('Identity', { zbayNickname: 'alice' })

    renderComponent(
      <>
        <Channel />
      </>,
      store
    )

    const channelName = screen.getByText('#general')
    expect(channelName).toBeVisible()

    const messageInput = screen.getByPlaceholderText(`Message #general as @${alice.zbayNickname}`)
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
    >('Identity', { id: community.id, zbayNickname: 'alice' })

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
        zbayNickname: 'john'
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
        const data = (input as socketEventData<
        [
          {
            peerId: string
            channelAddress: string
            ids: string[]
            communityId: string
          }
        ]
        >)[0]
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
})
