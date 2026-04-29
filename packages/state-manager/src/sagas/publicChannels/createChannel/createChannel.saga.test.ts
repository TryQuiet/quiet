import { combineReducers } from '@reduxjs/toolkit'
import { expectSaga } from 'redux-saga-test-plan'
import { type Socket } from '../../../types'
import { publicChannelsActions } from '../publicChannels.slice'
import { createChannelSaga } from './createChannel.saga'
import { type Store } from '../../store.types'
import { type FactoryGirl } from 'factory-girl'
import { setupCrypto } from '@quiet/identity'
import { prepareStore, testReducers } from '../../../utils/tests/prepareStore'
import { getReduxStoreFactory, getSocketFactory } from '../../../utils/tests/factories'
import { ChannelType, CreateChannelPayload, CreateChannelResponse, SocketActions } from '@quiet/types'
import { messagesActions } from '../../messages/messages.slice'
import { MockedSocket } from '../../../utils/tests/mockedSocket'

describe('createChannelSaga', () => {
  let store: Store
  let factory: FactoryGirl
  let socket: MockedSocket
  let socketPayloadFactory: FactoryGirl

  beforeAll(async () => {
    setupCrypto()
    store = prepareStore().store
    factory = await getReduxStoreFactory(store)
  })

  beforeEach(async () => {
    socketPayloadFactory = await getSocketFactory()
    socket = new MockedSocket()
  })

  it('creates new channel', async () => {
    const community = await factory.create('Community')

    const createChannelPayload = await socketPayloadFactory.build<CreateChannelPayload>(SocketActions.CREATE_CHANNEL)
    const createChannelResponse: CreateChannelResponse = await socket.buildResponse(SocketActions.CREATE_CHANNEL, {
      ...createChannelPayload,
    })
    socket.registerExpectedResponse(SocketActions.CREATE_CHANNEL, createChannelResponse)
    await expectSaga(
      createChannelSaga,
      socket as unknown as Socket,
      publicChannelsActions.createChannel(createChannelPayload)
    )
      .withReducer(combineReducers(testReducers))
      .withState(store.getState())
      .apply(socket, socket.emitWithAck, [SocketActions.CREATE_CHANNEL, createChannelPayload])
      .put(messagesActions.addPublicChannelsMessagesBase({ channelId: createChannelPayload.id }))
      .put(publicChannelsActions.addChannel(createChannelResponse))
      .put(
        publicChannelsActions.sendInitialChannelMessage({
          channelName: createChannelPayload.name,
          channelId: createChannelPayload.id,
          type: ChannelType.CHANNEL,
        })
      )
      .run()
  })

  it('creates new private channel', async () => {
    const community = await factory.create('Community')

    const createChannelPayload = await socketPayloadFactory.build<CreateChannelPayload>(SocketActions.CREATE_CHANNEL, {
      public: false,
    })
    const createChannelResponse: CreateChannelResponse = await socket.buildResponse(SocketActions.CREATE_CHANNEL, {
      ...createChannelPayload,
    })
    socket.registerExpectedResponse(SocketActions.CREATE_CHANNEL, createChannelResponse)
    await expectSaga(
      createChannelSaga,
      socket as unknown as Socket,
      publicChannelsActions.createChannel(createChannelPayload)
    )
      .withReducer(combineReducers(testReducers))
      .withState(store.getState())
      .apply(socket, socket.emitWithAck, [SocketActions.CREATE_CHANNEL, createChannelPayload])
      .put(messagesActions.addPublicChannelsMessagesBase({ channelId: createChannelPayload.id }))
      .put(publicChannelsActions.addChannel(createChannelResponse))
      .put(
        publicChannelsActions.sendInitialChannelMessage({
          channelName: createChannelPayload.name,
          channelId: createChannelPayload.id,
          type: ChannelType.CHANNEL,
        })
      )
      .run()
  })
})
