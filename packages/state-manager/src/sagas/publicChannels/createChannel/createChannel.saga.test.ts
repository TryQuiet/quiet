import { runSaga } from 'redux-saga'
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
      channel: {
        id: 'created-channel-id',
        name: createChannelPayload.name,
        description: createChannelPayload.description ?? '',
        owner: 'test-owner',
        timestamp: Date.now(),
        public: createChannelPayload.public,
        teamId: createChannelPayload.teamId,
      },
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
      .put(messagesActions.addPublicChannelsMessagesBase({ channelId: createChannelResponse.channel!.id }))
      .put(publicChannelsActions.addChannel(createChannelResponse))
      .put(
        publicChannelsActions.sendInitialChannelMessage({
          channelName: createChannelResponse.channel!.name,
          channelId: createChannelResponse.channel!.id,
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
      channel: {
        id: 'created-private-channel-id',
        name: createChannelPayload.name,
        description: createChannelPayload.description ?? '',
        owner: 'test-owner',
        timestamp: Date.now(),
        public: createChannelPayload.public,
        teamId: createChannelPayload.teamId,
      },
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
      .put(messagesActions.addPublicChannelsMessagesBase({ channelId: createChannelResponse.channel!.id }))
      .put(publicChannelsActions.addChannel(createChannelResponse))
      .put(
        publicChannelsActions.sendInitialChannelMessage({
          channelName: createChannelResponse.channel!.name,
          channelId: createChannelResponse.channel!.id,
          type: ChannelType.CHANNEL,
        })
      )
      .run()
  })
  it('waits for the authenticated DM ID and keeps the initial message out of channel metadata', async () => {
    const payload = {
      name: 'participants',
      public: false,
      type: ChannelType.DM,
      teamId: 'team',
      memberIds: ['bob', 'carol'],
    }
    const channel = {
      ...payload,
      id: 'dm_authenticated-backend-id',
      owner: 'bob',
      timestamp: 1,
      description: 'Direct message',
    }
    let reply!: (response: CreateChannelResponse) => void
    const emitWithAck = jest.fn(
      () =>
        new Promise<CreateChannelResponse>(resolve => {
          reply = resolve
        })
    )
    const dispatched: any[] = []
    const task = runSaga(
      { getState: store.getState, dispatch: action => dispatched.push(action) },
      createChannelSaga,
      { emitWithAck } as unknown as Socket,
      publicChannelsActions.createChannel({ ...payload, firstMessage: 'private first message' })
    )
    expect(emitWithAck).toHaveBeenCalledWith(SocketActions.CREATE_CHANNEL, payload)
    expect(dispatched).toEqual([])
    store.dispatch(publicChannelsActions.setCurrentChannel({ channelId: 'unrelated-public-channel' }))
    reply({ status: 'SUCCESS' as any, channel })
    await task.toPromise()
    const sends = dispatched.filter(action => action.type === messagesActions.sendMessage.type)
    expect(sends).toEqual([messagesActions.sendMessage({ channelId: channel.id, message: 'private first message' })])
    expect(dispatched.some(action => action.type === publicChannelsActions.sendInitialChannelMessage.type)).toBe(false)
  })
})
