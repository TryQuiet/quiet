import { combineReducers } from '@reduxjs/toolkit'
import { expectSaga } from 'redux-saga-test-plan'
import { type Socket } from '../../../types'
import { publicChannelsActions } from '../publicChannels.slice'
import { type Store } from '../../store.types'
import { type FactoryGirl } from 'factory-girl'
import { setupCrypto } from '@quiet/identity'
import { prepareStore, testReducers } from '../../../utils/tests/prepareStore'
import { getReduxStoreFactory, getSocketFactory } from '../../../utils/tests/factories'
import {
  AddMembersChannelPayload,
  AddMembersChannelResponse,
  Community,
  Identity,
  type PublicChannel,
  SocketActions,
} from '@quiet/types'
import { MockedSocket } from '../../../utils/tests/mockedSocket'
import { addMembersChannelSaga } from './addMembersChannel.saga'
import { publicChannelsSelectors } from '../publicChannels.selectors'
import { DateTime } from 'luxon'
import { select } from 'typed-redux-saga'

describe('addMembersChannelSaga', () => {
  let store: Store
  let factory: FactoryGirl
  let socket: MockedSocket
  let socketPayloadFactory: FactoryGirl
  let owner: Identity
  let community: Community

  const publicChannelName = 'general'
  const privateChannelName = 'private-chat'

  beforeAll(async () => {
    setupCrypto()
  })

  beforeEach(async () => {
    store = prepareStore().store
    factory = await getReduxStoreFactory(store)
    community = await factory.create('Community')
    owner = await factory.create('Identity', {
      communityId: community.id,
      nickname: 'alice',
    })
    socketPayloadFactory = await getSocketFactory()
    socket = new MockedSocket()
  })

  it('adds members to private channel', async () => {
    const channel: PublicChannel = (
      await factory.create('PublicChannel', {
        channel: {
          id: privateChannelName,
          name: privateChannelName,
          public: false,
          description: 'Welcome to #private-chat',
          timestamp: DateTime.utc().valueOf(),
          owner: owner.userId,
        },
      })
    ).channel
    const addMembersPayload = await socketPayloadFactory.build<AddMembersChannelPayload>(
      SocketActions.ADD_MEMBERS_TO_CHANNEL,
      {
        channelId: channel.id,
        channelName: channel.name,
        memberIds: ['foobar'],
      }
    )
    const addMembersResponse: AddMembersChannelResponse = await socket.buildResponse(
      SocketActions.ADD_MEMBERS_TO_CHANNEL,
      {
        ...addMembersPayload,
      }
    )
    socket.registerExpectedResponse(SocketActions.ADD_MEMBERS_TO_CHANNEL, addMembersResponse)
    await expectSaga(
      addMembersChannelSaga,
      socket as unknown as Socket,
      publicChannelsActions.addMembersChannel(addMembersPayload)
    )
      .withReducer(combineReducers(testReducers))
      .withState(store.getState())
      .provide([[select(publicChannelsSelectors.getChannelById), channel]])
      .apply(socket, socket.emitWithAck, [SocketActions.ADD_MEMBERS_TO_CHANNEL, addMembersPayload])
      .run()
  })

  it(`doesn't add members to private channel when channel can't be found`, async () => {
    const addMembersPayload = await socketPayloadFactory.build<AddMembersChannelPayload>(
      SocketActions.ADD_MEMBERS_TO_CHANNEL,
      {
        channelId: privateChannelName,
        channelName: privateChannelName,
        memberIds: ['foobar'],
      }
    )
    const addMembersResponse: AddMembersChannelResponse = await socket.buildResponse(
      SocketActions.ADD_MEMBERS_TO_CHANNEL,
      {
        ...addMembersPayload,
      }
    )
    socket.registerExpectedResponse(SocketActions.ADD_MEMBERS_TO_CHANNEL, addMembersResponse)
    await expectSaga(
      addMembersChannelSaga,
      socket as unknown as Socket,
      publicChannelsActions.addMembersChannel(addMembersPayload)
    )
      .withReducer(combineReducers(testReducers))
      .withState(store.getState())
      .provide([[select(publicChannelsSelectors.getChannelById), undefined]])
      .not.apply(socket, socket.emitWithAck, [SocketActions.ADD_MEMBERS_TO_CHANNEL, addMembersPayload])
      .run()
  })

  it(`doesn't add members to public channel (public = true)`, async () => {
    const channel: PublicChannel = (
      await factory.create('PublicChannel', {
        channel: {
          id: publicChannelName,
          name: publicChannelName,
          public: true,
          description: 'Welcome to #private-chat',
          timestamp: DateTime.utc().valueOf(),
          owner: owner.userId,
        },
      })
    ).channel
    const addMembersPayload = await socketPayloadFactory.build<AddMembersChannelPayload>(
      SocketActions.ADD_MEMBERS_TO_CHANNEL,
      {
        channelId: channel.id,
        channelName: channel.name,
        memberIds: ['foobar'],
      }
    )
    const addMembersResponse: AddMembersChannelResponse = await socket.buildResponse(
      SocketActions.ADD_MEMBERS_TO_CHANNEL,
      {
        ...addMembersPayload,
      }
    )
    socket.registerExpectedResponse(SocketActions.ADD_MEMBERS_TO_CHANNEL, addMembersResponse)
    await expectSaga(
      addMembersChannelSaga,
      socket as unknown as Socket,
      publicChannelsActions.addMembersChannel(addMembersPayload)
    )
      .withReducer(combineReducers(testReducers))
      .withState(store.getState())
      .provide([[select(publicChannelsSelectors.getChannelById), channel]])
      .not.apply(socket, socket.emitWithAck, [SocketActions.ADD_MEMBERS_TO_CHANNEL, addMembersPayload])
      .run()
  })

  it(`doesn't add members to public channel (public = undefined)`, async () => {
    const channel: PublicChannel = (
      await factory.create('PublicChannel', {
        channel: {
          id: publicChannelName,
          name: publicChannelName,
          public: undefined,
          description: 'Welcome to #private-chat',
          timestamp: DateTime.utc().valueOf(),
          owner: owner.userId,
        },
      })
    ).channel
    const addMembersPayload = await socketPayloadFactory.build<AddMembersChannelPayload>(
      SocketActions.ADD_MEMBERS_TO_CHANNEL,
      {
        channelId: channel.id,
        channelName: channel.name,
        memberIds: ['foobar'],
      }
    )
    const addMembersResponse: AddMembersChannelResponse = await socket.buildResponse(
      SocketActions.ADD_MEMBERS_TO_CHANNEL,
      {
        ...addMembersPayload,
      }
    )
    socket.registerExpectedResponse(SocketActions.ADD_MEMBERS_TO_CHANNEL, addMembersResponse)
    await expectSaga(
      addMembersChannelSaga,
      socket as unknown as Socket,
      publicChannelsActions.addMembersChannel(addMembersPayload)
    )
      .withReducer(combineReducers(testReducers))
      .withState(store.getState())
      .provide([[select(publicChannelsSelectors.getChannelById), channel]])
      .not.apply(socket, socket.emitWithAck, [SocketActions.ADD_MEMBERS_TO_CHANNEL, addMembersPayload])
      .run()
  })
})
