import { setupCrypto } from '@quiet/identity'
import { type Store } from '../../store.types'
import { prepareStore, testReducers } from '../../../utils/tests/prepareStore'
import { MockedSocket } from '../../../utils/tests/mockedSocket'
import { combineReducers, type AnyAction } from '@reduxjs/toolkit'
import { expectSaga } from 'redux-saga-test-plan'
import { call } from 'redux-saga-test-plan/matchers'
import { applyEmitParams, type Socket } from '../../../types'
import { type communitiesActions } from '../../communities/communities.slice'
import { messagesActions } from '../messages.slice'
import { generateMessageId, getCurrentTime } from '../utils/message.utils'
import { sendMessageSaga } from './sendMessage.saga'
import { type FactoryGirl } from 'factory-girl'

import { generateTestChannelId } from '@quiet/common'

import { publicChannelsActions } from '../../publicChannels/publicChannels.slice'
import { DateTime } from 'luxon'
import {
  type Community,
  type FileMetadata,
  type Identity,
  type PublicChannel,
  SocketActions,
  type SendMessagePayload,
  ChannelMessage,
} from '@quiet/types'
import { currentChannelId } from '../../publicChannels/publicChannels.selectors'
import { getSocketFactory, getReduxStoreFactory, getBaseTypesFactory } from '../../../utils/tests/factories'
import { identitySelectors } from '../../identity/identity.selectors'
import { identityActions } from '../../identity/identity.slice'
import { createLogger } from '../../../utils/logger'
import { runSaga, stdChannel } from 'redux-saga'
import * as messageUtils from '../utils/message.utils'

describe('sendMessageSaga', () => {
  let store: Store
  let factory: FactoryGirl
  let socketFactory: FactoryGirl
  let baseTypesFactory: FactoryGirl

  let community: Community
  let alice: Identity
  let socket: MockedSocket

  let sailingChannel: PublicChannel

  beforeAll(async () => {
    setupCrypto()

    store = prepareStore().store

    factory = await getReduxStoreFactory(store)
    socketFactory = await getSocketFactory()
    baseTypesFactory = await getBaseTypesFactory()

    community = await factory.create<ReturnType<typeof communitiesActions.addNewCommunity>['payload']>('Community')

    alice = await factory.create('Identity', {
      communityId: community.id,
      nickname: 'alice',
    })

    sailingChannel = (
      await factory.create<ReturnType<typeof publicChannelsActions.addChannel>['payload']>('PublicChannel', {
        channel: {
          name: 'sailing',
          description: 'Welcome to #sailing',
          timestamp: DateTime.utc().valueOf(),
          owner: alice.userId,
          id: generateTestChannelId('sailing'),
        },
      })
    ).channel!
  })

  beforeEach(async () => {
    socket = new MockedSocket()
  })

  test('sign and send message in current channel when identity is initialized', async () => {
    const logger = createLogger('sendMessageSaga-test1')
    // Get the current channel ID from the state
    const currentChannel = currentChannelId(store.getState())
    if (!currentChannel) throw new Error('no current channel')
    const channelMessage = await baseTypesFactory.build<ChannelMessage>('ChannelMessage', {
      userId: alice.userId,
      channelId: currentChannel,
    })

    const reducer = combineReducers(testReducers)
    await expectSaga(
      sendMessageSaga,
      socket as unknown as Socket,
      messagesActions.sendMessage({ message: channelMessage.message, channelId: currentChannel })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .provide([
        [call.fn(generateMessageId), channelMessage.id],
        [call.fn(getCurrentTime), channelMessage.createdAt],
      ])
      .not.take(identityActions.updateIdentity)
      .select(identitySelectors.currentIdentity)
      .apply(socket, socket.emit, applyEmitParams(SocketActions.SEND_MESSAGE, channelMessage))
      .run()
  })

  test('does not infer a target from the current channel when the send has no channel', async () => {
    const emit = jest.spyOn(socket, 'emit')
    await expectSaga(
      sendMessageSaga,
      socket as unknown as Socket,
      messagesActions.sendMessage({ message: 'private', channelId: '' })
    )
      .withReducer(combineReducers(testReducers))
      .withState(store.getState())
      .run()
    expect(emit).not.toHaveBeenCalled()
  })

  test('keeps the submitted channel through message ID, identity and subscription waits', async () => {
    const reducer = combineReducers(testReducers)
    let state: ReturnType<typeof reducer> = {
      ...reducer(undefined, { type: '@@INIT' }),
      ...store.getState(),
      Identity: { ...store.getState().Identity, identities: { ids: [], entities: {} } },
      PublicChannels: {
        ...store.getState().PublicChannels,
        channelsSubscriptions: { ids: [], entities: {} },
      },
    }
    const input = stdChannel()
    const dispatch = (action: AnyAction) => {
      state = reducer(state, action)
      input.put(action)
    }
    let releaseId!: (id: string) => void
    const generatedId = new Promise<string>(resolve => {
      releaseId = resolve
    })
    // Suspend this call effect to exercise a channel switch before the send resumes.
    const idSpy = jest.spyOn(messageUtils, 'generateMessageId').mockReturnValueOnce(generatedId as unknown as string)
    const emit = jest.spyOn(socket, 'emit')
    const task = runSaga(
      { channel: input, dispatch, getState: () => state },
      sendMessageSaga,
      socket as unknown as Socket,
      messagesActions.sendMessage({ message: 'private', channelId: sailingChannel.id })
    )
    try {
      dispatch(publicChannelsActions.setCurrentChannel({ channelId: generateTestChannelId('public') }))
      releaseId('fixed-send-id')
      await Promise.resolve()
      expect(emit).not.toHaveBeenCalled()
      dispatch(identityActions.addNewIdentity(alice))
      dispatch(identityActions.updateIdentity(alice))
      expect(emit).not.toHaveBeenCalled()
      dispatch(publicChannelsActions.setChannelSubscribed({ channelId: sailingChannel.id }))
      await task.toPromise()
      expect(emit).toHaveBeenCalledWith(
        SocketActions.SEND_MESSAGE,
        expect.objectContaining({
          id: 'fixed-send-id',
          message: 'private',
          channelId: sailingChannel.id,
        })
      )
    } finally {
      task.cancel()
      idSpy.mockRestore()
    }
  })

  test('sign and send message in specific channel', async () => {
    const logger = createLogger('sendMessageSaga-test1')
    // Get the current channel ID from the state
    const channelMessage = await baseTypesFactory.build<ChannelMessage>('ChannelMessage', {
      userId: alice.userId,
      channelId: sailingChannel.id,
    })
    const reducer = combineReducers(testReducers)
    await expectSaga(
      sendMessageSaga,
      socket as unknown as Socket,
      messagesActions.sendMessage({ message: channelMessage.message, channelId: sailingChannel.id })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .provide([
        [call.fn(generateMessageId), channelMessage.id],
        [call.fn(getCurrentTime), channelMessage.createdAt],
      ])
      .apply(socket, socket.emit, applyEmitParams(SocketActions.SEND_MESSAGE, channelMessage))
      .run()
  })

  test('waits for the target channel subscription before emitting', async () => {
    const channelId = sailingChannel.id
    const channelMessage = await baseTypesFactory.build<ChannelMessage>('ChannelMessage', {
      userId: alice.userId,
      channelId,
    })
    const reducer = combineReducers(testReducers)
    const baseState = store.getState()
    const stateWithNoSubscriptions = {
      ...baseState,
      PublicChannels: {
        ...baseState.PublicChannels,
        channelsSubscriptions: {
          ids: [],
          entities: {},
        },
      },
    }

    await expectSaga(
      sendMessageSaga,
      socket as unknown as Socket,
      messagesActions.sendMessage({ message: channelMessage.message, channelId })
    )
      .withReducer(reducer)
      .withState(stateWithNoSubscriptions)
      .provide([
        [call.fn(generateMessageId), channelMessage.id],
        [call.fn(getCurrentTime), channelMessage.createdAt],
      ])
      .dispatch(publicChannelsActions.setChannelSubscribed({ channelId: generateTestChannelId('unrelated') }))
      .dispatch(publicChannelsActions.setChannelSubscribed({ channelId }))
      .apply(socket, socket.emit, applyEmitParams(SocketActions.SEND_MESSAGE, channelMessage))
      .run()
  })

  test('do not broadcast message until file is uploaded', async () => {
    const messageId = Math.random().toString(36).substr(2.9)
    const currentChannel = currentChannelId(store.getState())
    if (!currentChannel) {
      throw new Error('no currentChannel')
    }

    const media: FileMetadata = {
      cid: `attaching_${messageId}`,
      path: 'path/to/file',
      name: 'file',
      ext: 'ext',
      message: {
        id: messageId,
        channelId: currentChannel,
      },
    }

    const emit = jest.spyOn(socket, 'emit')
    const reducer = combineReducers(testReducers)
    await expectSaga(
      sendMessageSaga,
      socket as unknown as Socket,
      messagesActions.sendMessage({ message: '', media, channelId: currentChannel })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .provide([
        [call.fn(generateMessageId), 4],
        [call.fn(getCurrentTime), 8],
      ])
      .run()
    expect(emit).not.toHaveBeenCalled()
  })
})
