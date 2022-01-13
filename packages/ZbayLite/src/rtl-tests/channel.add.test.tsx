import React from 'react'
import '@testing-library/jest-dom/extend-expect'
import userEvent from '@testing-library/user-event'
import { screen } from '@testing-library/dom'
import { act } from 'react-dom/test-utils'
import { take } from 'typed-redux-saga'
import MockedSocket from 'socket.io-mock'
import { ioMock } from '../shared/setupTests'
import { socketEventData } from '../renderer/testUtils/socket'
import { renderComponent } from '../renderer/testUtils/renderComponent'
import { prepareStore } from '../renderer/testUtils/prepareStore'
import { StoreKeys } from '../renderer/store/store.keys'

import Sidebar from '../renderer/components/widgets/sidebar/Sidebar'
import CreateChannel from '../renderer/containers/widgets/channels/CreateChannel'
import Channel from '../renderer/containers/pages/Channel'

import {
  getFactory,
  identity,
  publicChannels,
  PublicChannel,
  SocketActionTypes
} from '@zbayapp/nectar'

import { ModalsInitialState } from '../renderer/sagas/modals/modals.slice'
import { ModalName } from '../renderer/sagas/modals/modals.types'

describe('Add new channel', () => {
  let socket: MockedSocket

  beforeEach(() => {
    socket = new MockedSocket()
    ioMock.mockImplementation(() => socket)
  })

  it('Opens modal on button click', async () => {
    const { store } = await prepareStore(
      {},
      socket // Fork Nectar's sagas
    )

    const factory = await getFactory(store)

    await factory.create<ReturnType<typeof identity.actions.addNewIdentity>['payload']>(
      'Identity',
      { zbayNickname: 'alice' }
    )

    renderComponent(
      <>
        <Sidebar />
        <CreateChannel />
      </>,
      store
    )

    const addChannel = screen.getByTestId('addChannelButton')
    userEvent.click(addChannel)

    const title = await screen.findByText('Create a new public channel')
    expect(title).toBeVisible()
  })

  it('Adds new channel and opens it', async () => {
    const { store, runSaga } = await prepareStore(
      {
        [StoreKeys.Modals]: {
          ...new ModalsInitialState(),
          [ModalName.createChannel]: { open: true }
        }
      },
      socket // Fork Nectar's sagas
    )

    const factory = await getFactory(store)

    const alice = await factory.create<
    ReturnType<typeof identity.actions.addNewIdentity>['payload']
    >('Identity', { zbayNickname: 'alice' })

    jest
      .spyOn(socket, 'emit')
      .mockImplementation(async (action: SocketActionTypes, ...input: any[]) => {
        if (action === SocketActionTypes.SUBSCRIBE_TO_TOPIC) {
          const data = input as socketEventData<[string, PublicChannel]>
          expect(data[0]).toEqual(alice.peerId.id)
          expect(data[1].name).toEqual('my-super-channel')
          return socket.socketClient.emit(SocketActionTypes.CREATED_CHANNEL, {
            channel: data[1],
            communityId: alice.id // Identity id is the same as community id
          })
        }
      })

    renderComponent(
      <>
        <Sidebar />
        <CreateChannel />
        <Channel />
      </>,
      store
    )

    const input = screen.getByPlaceholderText('Enter a channel name')
    userEvent.type(input, 'my Super Channel')

    // Check if parsed channel name displays properly
    const info = screen.getByText('#my-super-channel')
    expect(info).toBeVisible()

    const button = screen.getByText('Create Channel')
    userEvent.click(button)

    await act(async () => {
      await runSaga(testCreateChannelSaga).toPromise()
    })

    function* testCreateChannelSaga(): Generator {
      const createChannelAction = yield* take(publicChannels.actions.createChannel)
      expect(createChannelAction.payload.channel.name).toEqual('my-super-channel')
      expect(createChannelAction.payload.channel.owner).toEqual(alice.zbayNickname)
      const addChannelAction = yield* take(publicChannels.actions.addChannel)
      expect(addChannelAction.payload.channel).toEqual(createChannelAction.payload.channel)
    }

    const createChannelModal = screen.queryByTestId('createChannelModal')
    expect(createChannelModal).toBeNull()

    // Check if newly created channel is present and selected
    const channelTitle = screen.getByTestId('channelTitle')
    expect(channelTitle).toHaveTextContent('#my-super-channel')

    // Check if sidebar item displays as selected
    const link = screen.getByTestId('my-super-channel-link')
    expect(link).toHaveClass('makeStyles-selected-539')
  })
})
