import { setupCrypto } from '@quiet/identity'
import { type Store } from '../../store.types'
import { prepareStore, testReducers } from '../../../utils/tests/prepareStore'
import { getReduxStoreFactory } from '../../..'
import { type FactoryGirl } from 'factory-girl'
import { combineReducers } from 'redux'
import { expectSaga } from 'redux-saga-test-plan'
import { publicChannelsActions } from '../publicChannels.slice'
import { DateTime } from 'luxon'
import { deleteChannelSaga } from './deleteChannel.saga'
import { type Socket } from '../../../types'
import { generateTestChannelId } from '@quiet/common'
import { filesActions } from '../../files/files.slice'
import {
  type Community,
  type Identity,
  type PublicChannel,
  SocketActions,
  DeleteChannelResponse,
  DeleteChannelPayload,
} from '@quiet/types'
import { publicChannelsSelectors } from '../publicChannels.selectors'
import { createLogger } from '../../../utils/logger'
import { MockedSocket } from '../../../utils/tests/mockedSocket'
import { getBaseTypesFactory, getSocketFactory } from '../../../utils/tests/factories'

describe('deleteChannelSaga', () => {
  let store: Store
  let factory: FactoryGirl
  let socketPayloadFactory: FactoryGirl
  let baseTypesFactory: FactoryGirl
  const reducers = combineReducers(testReducers)

  let community: Community
  let owner: Identity

  let photoChannel: PublicChannel
  let generalChannel: PublicChannel

  beforeEach(async () => {
    setupCrypto()

    socketPayloadFactory = await getSocketFactory()
    baseTypesFactory = await getBaseTypesFactory()
    store = prepareStore().store
    factory = await getReduxStoreFactory(store)

    community = await factory.create('Community')

    owner = await factory.create('Identity', {
      communityId: community.id,
      nickname: 'alice',
    })
    const generalChannelState = publicChannelsSelectors.generalChannel(store.getState())
    if (generalChannelState) generalChannel = generalChannelState
    expect(generalChannel).not.toBeUndefined()

    photoChannel = (
      await factory.create('PublicChannel', {
        channel: {
          name: 'photo',
          description: 'Welcome to #photo',
          timestamp: DateTime.utc().valueOf(),
          owner: owner.userId,
          id: generateTestChannelId('photo'),
        },
      })
    ).channel
  })

  test('delete standard channel', async () => {
    const logger = createLogger('deleteChannelSaga-test1')
    const socket = new MockedSocket()
    const channelId = photoChannel.id
    store.dispatch(publicChannelsActions.setCurrentChannel({ channelId }))
    const deleteChannelPayload: DeleteChannelPayload = {
      channelId,
    }
    const deleteChannelResponse: DeleteChannelResponse = await socket.buildResponse(SocketActions.DELETE_CHANNEL)
    logger.info(`deleteChannelResponse: ${JSON.stringify(deleteChannelResponse)}`)
    socket.registerExpectedResponse(SocketActions.DELETE_CHANNEL, deleteChannelResponse)

    await expectSaga(deleteChannelSaga, socket as unknown as Socket, publicChannelsActions.deleteChannel({ channelId }))
      .withReducer(reducers)
      .withState(store.getState())
      .apply(socket, socket.emitWithAck, [SocketActions.DELETE_CHANNEL, deleteChannelPayload])
      .put(publicChannelsActions.channelDeletionResponse(deleteChannelResponse))
      .run()
  })

  test('delete general channel', async () => {
    const logger = createLogger('deleteChannelSaga-test2')
    const socket = new MockedSocket()
    const channelId = generalChannel.id
    const deleteChannelPayload: DeleteChannelPayload = {
      channelId,
    }
    const deleteChannelResponse: DeleteChannelResponse = await socket.buildResponse(SocketActions.DELETE_CHANNEL)
    logger.info(`deleteChannelResponse: ${JSON.stringify(deleteChannelResponse)}`)
    socket.registerExpectedResponse(SocketActions.DELETE_CHANNEL, deleteChannelResponse)

    await expectSaga(deleteChannelSaga, socket as unknown as Socket, publicChannelsActions.deleteChannel({ channelId }))
      .withReducer(reducers)
      .withState(store.getState())
      .apply(socket, socket.emitWithAck, [SocketActions.DELETE_CHANNEL, deleteChannelPayload])
      .put(publicChannelsActions.channelDeletionResponse(deleteChannelResponse))
      .run()
  })

  test('delete standard channel - already disabled', async () => {
    const logger = createLogger('deleteChannelSaga-test3')
    const socket = new MockedSocket()
    const channelId = photoChannel.id
    store.dispatch(publicChannelsActions.setCurrentChannel({ channelId }))
    store.dispatch(publicChannelsActions.disableChannel({ channelId }))

    const deleteChannelPayload: DeleteChannelPayload = {
      channelId,
    }
    const deleteChannelResponse: DeleteChannelResponse = await socket.buildResponse(SocketActions.DELETE_CHANNEL, {
      deleted: false,
      channelId: channelId,
    })
    logger.info(`deleteChannelResponse: ${JSON.stringify(deleteChannelResponse)}`)
    socket.registerExpectedResponse(SocketActions.DELETE_CHANNEL, deleteChannelResponse)

    logger.info(`deleteChannelResponse: ${JSON.stringify(deleteChannelResponse)}`)
    await expectSaga(
      deleteChannelSaga,
      socket as unknown as Socket,
      publicChannelsActions.deleteChannel(deleteChannelPayload)
    )
      .withReducer(reducers)
      .withState(store.getState())
      .not.apply(socket, socket.emitWithAck, [SocketActions.DELETE_CHANNEL, deleteChannelPayload])
      .not.put(publicChannelsActions.channelDeletionResponse(deleteChannelResponse))
      .run()
  })

  test('delete standard channel when currentChannel is not specified - mobile channel list case', async () => {
    const logger = createLogger('deleteChannelSaga-test4')
    const socket = new MockedSocket()
    const channelId = photoChannel.id
    store.dispatch(publicChannelsActions.setCurrentChannel({ channelId: '' }))
    const deleteChannelPayload: DeleteChannelPayload = {
      channelId,
    }
    const deleteChannelResponse: DeleteChannelResponse = await socket.buildResponse(SocketActions.DELETE_CHANNEL)
    logger.info(`deleteChannelResponse: ${JSON.stringify(deleteChannelResponse)}`)
    socket.registerExpectedResponse(SocketActions.DELETE_CHANNEL, deleteChannelResponse)

    await expectSaga(deleteChannelSaga, socket as unknown as Socket, publicChannelsActions.deleteChannel({ channelId }))
      .withReducer(reducers)
      .withState(store.getState())
      .apply(socket, socket.emitWithAck, [SocketActions.DELETE_CHANNEL, deleteChannelPayload])
      .put(publicChannelsActions.channelDeletionResponse(deleteChannelResponse))
      .run()
  })
})
