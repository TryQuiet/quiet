import React from 'react'
import '@testing-library/jest-dom/extend-expect'
import userEvent from '@testing-library/user-event'
import { screen, waitFor } from '@testing-library/dom'
import { act } from 'react-dom/test-utils'
import { take } from 'typed-redux-saga'
import MockedSocket from 'socket.io-mock'
import { ioMock } from '../shared/setupTests'
import { socketEventData } from '../renderer/testUtils/socket'
import { renderComponent } from '../renderer/testUtils/renderComponent'
import { prepareStore } from '../renderer/testUtils/prepareStore'
import { StoreKeys } from '../renderer/store/store.keys'

import CreateChannel from '../renderer/components/Channel/CreateChannel/CreateChannel'
import Channel from '../renderer/components/Channel/Channel'
import Sidebar from '../renderer/components/Sidebar/Sidebar'

import {
  CreateChannelPayload,
  ErrorMessages,
  getFactory,
  identity,
  publicChannels,
  SendMessagePayload,
  SocketActionTypes
} from '@quiet/state-manager'

import { modalsActions, ModalsInitialState } from '../renderer/sagas/modals/modals.slice'
import { ModalName } from '../renderer/sagas/modals/modals.types'

jest.setTimeout(20_000)

describe('Add new channel', () => {
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

  it('Opens modal on button click', async () => {
    const { store } = await prepareStore(
      {},
      socket // Fork state manager's sagas
    )

    const factory = await getFactory(store)

    await factory.create<ReturnType<typeof identity.actions.addNewIdentity>['payload']>(
      'Identity',
      { nickname: 'alice' }
    )

    renderComponent(
      <>
        <Sidebar />
        <CreateChannel />
      </>,
      store
    )

    const addChannel = screen.getByTestId('addChannelButton')
    await userEvent.click(addChannel)

    const title = await screen.findByText('Create a new public channel')
    expect(title).toBeVisible()
  })

  it('Adds new channel and opens it. Sends initial message', async () => {
    const { store, runSaga } = await prepareStore(
      {
        [StoreKeys.Modals]: {
          ...new ModalsInitialState(),
          [ModalName.createChannel]: { open: true }
        }
      },
      socket // Fork state manager's sagas
    )

    const factory = await getFactory(store)
    const alice = await factory.create<
      ReturnType<typeof identity.actions.addNewIdentity>['payload']
    >('Identity', { nickname: 'alice' })
    const channelName = { input: 'my-Super Channel ', output: 'my-super-channel' }

    jest
      .spyOn(socket, 'emit')
      .mockImplementation(async (action: SocketActionTypes, ...input: any[]) => {
        if (action === SocketActionTypes.CREATE_CHANNEL) {
          const data = input as socketEventData<[CreateChannelPayload]>
          const payload = data[0]
          expect(payload.channel.owner).toEqual(alice.nickname)
          expect(payload.channel.name).toEqual(channelName.output)
          return socket.socketClient.emit(SocketActionTypes.CHANNELS_REPLICATED, {
            channels: {
              [payload.channel.name]: payload.channel
            },
          })
        }
        if (action === SocketActionTypes.SEND_MESSAGE) {
          const data = input as socketEventData<[SendMessagePayload]>
          const { message } = data[0]
          expect(message.channelAddress).toEqual(channelName.output)
          expect(message.message).toEqual(`Created #${channelName.output}`)
          return socket.socketClient.emit(SocketActionTypes.INCOMING_MESSAGES, {
            messages: [message],
            communityId: alice.id
          })
        }
      })

    window.HTMLElement.prototype.scrollTo = jest.fn()

    renderComponent(
      <>
        <Sidebar />
        <CreateChannel />
        <Channel />
      </>,
      store
    )
    const user = userEvent.setup()
    const input = screen.getByPlaceholderText('Enter a channel name')
    await user.type(input, channelName.input)

    // FIXME: await user.click(screen.getByText('Create Channel') causes this and few other tests to fail (hangs on taking createChannel action)
    await act(async () => await waitFor(() => { user.click(screen.getByText('Create Channel')).catch((e) => { console.error(e) }) }))

    await act(async () => {
      await runSaga(testCreateChannelSaga).toPromise()
    })

    function* testCreateChannelSaga(): Generator {
      const createChannelAction = yield* take(publicChannels.actions.createChannel)
      expect(createChannelAction.payload.channel.name).toEqual(channelName.output)
      expect(createChannelAction.payload.channel.owner).toEqual(alice.nickname)
      const addChannelAction = yield* take(publicChannels.actions.addChannel)
      expect(addChannelAction.payload.channel).toEqual(createChannelAction.payload.channel)
    }

    const createChannelModal = screen.queryByTestId('createChannelModal')
    expect(createChannelModal).toBeNull()

    // Check if newly created channel is present and selected
    expect(screen.getByTestId('channelTitle')).toHaveTextContent(`#${channelName.output}`)
    // Check if sidebar item displays as selected
    const link = screen.getByTestId(`${channelName.output}-link`)
    expect(link).toHaveStyle('backgroundColor: rgb(103, 191, 211)') // lushSky: '#67BFD3'
  })

  it('Displays error if trying to add channel with already taken name', async () => {
    const { store } = await prepareStore(
      {},
      socket // Fork state manager's sagas
    )
    const factory = await getFactory(store)

    const channel = await factory.create<
      ReturnType<typeof publicChannels.actions.addChannel>['payload']
    >('PublicChannel')

    renderComponent(<CreateChannel />, store)

    store.dispatch(modalsActions.openModal({ name: ModalName.createChannel }))

    const input = await screen.findByPlaceholderText('Enter a channel name')
    await userEvent.type(input, channel.channel.name)

    const button = screen.getByText('Create Channel')
    await userEvent.click(button)

    const error = await screen.findByText(ErrorMessages.CHANNEL_NAME_TAKEN)
    expect(error).toBeVisible()
  })
})
