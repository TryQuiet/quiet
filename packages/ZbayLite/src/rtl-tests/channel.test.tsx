import React from 'react'
import '@testing-library/jest-dom/extend-expect'
import { act } from 'react-dom/test-utils'
import { screen } from '@testing-library/dom'
import { apply, fork, take } from 'typed-redux-saga'
import MockedSocket from 'socket.io-mock'
import { ioMock } from '../shared/setupTests'
import { socketEventData } from '../renderer/testUtils/socket'
import { renderComponent } from '../renderer/testUtils/renderComponent'
import { prepareStore } from '../renderer/testUtils/prepareStore'

import Channel from '../renderer/containers/pages/Channel'

import { identity, communities, publicChannels, getFactory, SocketActionTypes } from '@zbayapp/nectar'

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

    const holmes = await factory.create<
    ReturnType<typeof identity.actions.addNewIdentity>['payload']
    >('Identity', { zbayNickname: 'holmes' })

    renderComponent(
      <>
        <Channel />
      </>,
      store
    )

    const channelName = screen.getByText('#general')
    expect(channelName).toBeVisible()

    const messageInput = screen.getByPlaceholderText(`Message #general as @${holmes.zbayNickname}`)
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

    const holmes = await factory.create<
    ReturnType<typeof identity.actions.addNewIdentity>['payload']
    >('Identity', { id: community.id, zbayNickname: 'holmes' })

    const holmesMessage = await factory.create<
    ReturnType<typeof publicChannels.actions.signMessage>['payload']
    >('SignedMessage', {
      identity: holmes
    })

    // Data from below will build but it won't be stored
    const bartek = (
      await factory.build<typeof identity.actions.addNewIdentity>('Identity', {
        id: community.id,
        zbayNickname: 'bartek'
      })
    ).payload

    const bartekMessage = (
      await factory.build<typeof publicChannels.actions.signMessage>('SignedMessage', {
        identity: bartek
      })
    ).payload

    renderComponent(
      <>
        <Channel />
      </>,
      store
    )

    const persistedMessage = await screen.findByText(holmesMessage.message.message)
    expect(persistedMessage).toBeVisible()

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
        if (data.ids[0] !== bartekMessage.message.id) {
          fail('Missing message has not been requested')
        }
        return socket.socketClient.emit(SocketActionTypes.RESPONSE_ASK_FOR_MESSAGES, {
          channelAddress: data.channelAddress,
          messages: [bartekMessage.message],
          communityId: data.communityId
        })
      }
    })

    // New message is not yet fetched from db
    expect(screen.queryByText(bartekMessage.message.message)).toBeNull()

    await act(async () => {
      await runSaga(testReceiveMessage).toPromise()
    })

    const newMessage = await screen.findByText(bartekMessage.message.message)
    expect(newMessage).toBeVisible()

    function* mockSendMessagesIds(): Generator {
      yield* apply(socket.socketClient, socket.socketClient.emit, [
        SocketActionTypes.SEND_MESSAGES_IDS,
        {
          peerId: holmes.peerId.id,
          channelAddress: 'general',
          ids: [holmesMessage.message.id, bartekMessage.message.id],
          communityId: community.id
        }
      ])
    }

    function* testReceiveMessage(): Generator {
      yield* fork(mockSendMessagesIds)
      yield* take(publicChannels.actions.responseSendMessagesIds)
      yield* take(publicChannels.actions.askForMessages)
      yield* take(publicChannels.actions.responseAskForMessages)
    }
  })
})
