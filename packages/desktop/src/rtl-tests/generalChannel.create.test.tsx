import React from 'react'
import { act } from 'react-dom/test-utils'
import '@testing-library/jest-dom/extend-expect'
import { apply, fork, take } from 'typed-redux-saga'
import { renderComponent } from '../renderer/testUtils/renderComponent'
import { prepareStore } from '../renderer/testUtils/prepareStore'
import MockedSocket from 'socket.io-mock'
import { ioMock } from '../shared/setupTests'
import { socketEventData } from '../renderer/testUtils/socket'
import {
  identity,
  publicChannels,
  getFactory,
  SocketActionTypes,
  ChannelsReplicatedPayload
} from '@quiet/state-manager'
import Channel from '../renderer/components/Channel/Channel'

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
      disconnect: jest.fn()
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

    await factory.create<
    ReturnType<typeof identity.actions.addNewIdentity>['payload']
    >('Identity', { nickname: 'alice' })

    jest
      .spyOn(socket, 'emit')
      .mockImplementation(async (action: SocketActionTypes, ...input: any[]) => {
        if (action === SocketActionTypes.CHANNELS_REPLICATED) {
          const data = input as socketEventData<[ChannelsReplicatedPayload]>
          const payload = data[0][0]
          expect(payload.channel.name).toEqual('general')
        }
      })

    await act(async () => {
      await runSaga(testCreateGeneralChannelSaga).toPromise()
    })

    function* mockNewCommunityEvent(): Generator {
      yield* apply(socket.socketClient, socket.socketClient.emit, [
        SocketActionTypes.NEW_COMMUNITY,
        {
          id: communityId
        }
      ])
    }

    function* testCreateGeneralChannelSaga(): Generator {
      yield* fork(mockNewCommunityEvent)
      yield* take(publicChannels.actions.createChannel)
      yield* take(publicChannels.actions.setCurrentChannel)
    }
  })
})
