import React from 'react'
import { act } from 'react-dom/test-utils'
import '@testing-library/jest-dom/extend-expect'
import { apply, fork, take } from 'typed-redux-saga'
import { renderComponent } from '../renderer/testUtils/renderComponent'
import { prepareStore } from '../renderer/testUtils/prepareStore'
import MockedSocket from 'socket.io-mock'
import { ioMock } from '../shared/setupTests'
import { socketEventData } from '../renderer/testUtils/socket'
import { AnyAction } from 'redux'
import {
  identity,
  publicChannels,
  getFactory,
  SocketActionTypes,
  ChannelsReplicatedPayload,
} from '@quiet/state-manager'
import Channel from '../renderer/components/Channel/Channel'
import { waitFor } from '@testing-library/dom'

jest.setTimeout(20_000)

describe('General channel', () => {
  let socket: MockedSocket
  let communityId: string

  beforeEach(() => {
    socket = new MockedSocket()
    ioMock.mockImplementation(() => socket)
    window.ResizeObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }))
  })

  it('create automatically along with creating community', async () => {
    const { store, runSaga } = await prepareStore(
      {},
      socket // Fork state manager's sagas
    )

    window.HTMLElement.prototype.scrollTo = jest.fn()

    renderComponent(
      <>
        <Channel />
      </>,
      store
    )

    const factory = await getFactory(store)

    await factory.create<ReturnType<typeof identity.actions.addNewIdentity>['payload']>('Identity', {
      nickname: 'alice',
    })

    jest.spyOn(socket, 'emit').mockImplementation(async (...input: [SocketActionTypes, ...socketEventData<[any]>]) => {
      const action = input[0]
      if (action === SocketActionTypes.CREATE_CHANNEL) {
        const payload = input[1] as ChannelsReplicatedPayload
        expect(payload.channels.channel?.name).toEqual('general')
      }
    })

    // Log all the dispatched actions in order
    const actions: AnyAction[] = []
    runSaga(function* (): Generator {
      while (true) {
        const action = yield* take()
        actions.push(action.type)
      }
    })

    await act(async () => {
      await runSaga(testCreateGeneralChannelSaga).toPromise()
    })

    function* mockNewCommunityEvent(): Generator {
      yield* apply(socket.socketClient, socket.socketClient.emit, [
        SocketActionTypes.NEW_COMMUNITY,
        {
          id: communityId,
        },
      ])
    }

    function* testCreateGeneralChannelSaga(): Generator {
      yield* fork(mockNewCommunityEvent)
      yield* take(publicChannels.actions.createChannel)
      yield* take(publicChannels.actions.setCurrentChannel)
    }

    expect(actions).toMatchInlineSnapshot(`
      Array [
        "Communities/sendCommunityMetadata",
        "PublicChannels/createGeneralChannel",
        "Identity/saveUserCsr",
        "PublicChannels/createChannel",
        "PublicChannels/setCurrentChannel",
        "PublicChannels/clearUnreadChannel",
        "Messages/lazyLoading",
        "Messages/resetCurrentPublicChannelCache",
      ]
    `)
  })
})
