import { setupCrypto } from '@quiet/identity'
import { type Store } from '../../store.types'
import { prepareStore, testReducers } from '../../../utils/tests/prepareStore'
import { MockedSocket } from '../../../utils/tests/mockedSocket'
import { combineReducers } from '@reduxjs/toolkit'
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
  MessageType,
  type PublicChannel,
  SocketActions,
  type SendMessagePayload,
  ChannelMessage,
} from '@quiet/types'
import { currentChannelId, publicChannelsSelectors } from '../../publicChannels/publicChannels.selectors'
import { getSocketFactory, getReduxStoreFactory, getBaseTypesFactory } from '../../../utils/tests/factories'
import { identitySelectors } from '../../identity/identity.selectors'
import { identityActions } from '../../identity/identity.slice'
import { createLogger } from '../../../utils/logger'

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
    const channelMessage = await baseTypesFactory.build<ChannelMessage>('ChannelMessage', {
      userId: alice.userId,
      channelId: currentChannel,
    })

    const reducer = combineReducers(testReducers)
    await expectSaga(
      sendMessageSaga,
      socket as unknown as Socket,
      messagesActions.sendMessage({ message: channelMessage.message })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .provide([
        [call.fn(generateMessageId), channelMessage.id],
        [call.fn(getCurrentTime), channelMessage.createdAt],
      ])
      .not.take(identityActions.updateIdentity)
      .select(identitySelectors.currentIdentity)
      .select(publicChannelsSelectors.currentChannelId)
      .apply(socket, socket.emit, applyEmitParams(SocketActions.SEND_MESSAGE, channelMessage))
      .run()
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
      cid: 'cid',
      path: `attaching_${messageId}`,
      name: 'file',
      ext: 'ext',
      message: {
        id: messageId,
        channelId: currentChannel,
      },
    }

    const reducer = combineReducers(testReducers)
    await expectSaga(sendMessageSaga, socket as unknown as Socket, messagesActions.sendMessage({ message: '', media }))
      .withReducer(reducer)
      .withState(store.getState())
      .provide([
        [call.fn(generateMessageId), 4],
        [call.fn(getCurrentTime), 8],
      ])
      .not.apply(socket, socket.emit, [
        SocketActions.SEND_MESSAGE,
        {
          peerId: alice.networkInfo.peerId.id,
          message: {
            id: 4,
            type: MessageType.Basic,
            message: 'message',
            createdAt: 8,
            channelId: currentChannel,
            signature: 'signature',
            pubKey: 'publicKey',
            media: undefined,
          },
        },
      ])
      .run()
  })

  // https://github.com/TryQuiet/quiet/issues/2778 - a text message that is only
  // whitespace must never be broadcast or shown in the channel.
  test('drops a whitespace-only text message', async () => {
    const reducer = combineReducers(testReducers)
    await expectSaga(sendMessageSaga, socket as unknown as Socket, messagesActions.sendMessage({ message: ' ' }))
      .withReducer(reducer)
      .withState(store.getState())
      .provide([
        [call.fn(generateMessageId), 'whitespace-only'],
        [call.fn(getCurrentTime), 1],
      ])
      // The saga bails out before it does any work at all
      .not.call.fn(generateMessageId)
      .not.put.actionType(messagesActions.addMessagesSendingStatus.type)
      .not.put.actionType(messagesActions.addMessages.type)
      .run()
  })

  test('drops a text message made only of newlines and tabs', async () => {
    const reducer = combineReducers(testReducers)
    await expectSaga(sendMessageSaga, socket as unknown as Socket, messagesActions.sendMessage({ message: '\n\t  \n' }))
      .withReducer(reducer)
      .withState(store.getState())
      .provide([
        [call.fn(generateMessageId), 'whitespace-only-2'],
        [call.fn(getCurrentTime), 1],
      ])
      .not.call.fn(generateMessageId)
      .not.put.actionType(messagesActions.addMessages.type)
      .run()
  })

  test('sends surrounding whitespace verbatim when the message has content', async () => {
    // Leading whitespace is markdown-significant (four spaces open a code block),
    // so message content is never trimmed - only fully blank messages are dropped.
    const currentChannel = currentChannelId(store.getState())
    const message = '    const x = 1  '
    const channelMessage = await baseTypesFactory.build<ChannelMessage>('ChannelMessage', {
      userId: alice.userId,
      channelId: currentChannel,
      message,
    })

    const reducer = combineReducers(testReducers)
    await expectSaga(sendMessageSaga, socket as unknown as Socket, messagesActions.sendMessage({ message }))
      .withReducer(reducer)
      .withState(store.getState())
      .provide([
        [call.fn(generateMessageId), channelMessage.id],
        [call.fn(getCurrentTime), channelMessage.createdAt],
      ])
      .apply(socket, socket.emit, applyEmitParams(SocketActions.SEND_MESSAGE, channelMessage))
      .run()
  })

  test('sends an uploaded file message even though its text is empty', async () => {
    const currentChannel = currentChannelId(store.getState())
    if (!currentChannel) {
      throw new Error('no currentChannel')
    }

    const messageId = 'uploaded-file-message'
    const media: FileMetadata = {
      cid: 'QmUploadedFileCid',
      path: null,
      name: 'file',
      ext: '.ext',
      message: {
        id: messageId,
        channelId: currentChannel,
      },
    }

    const expectedMessage: ChannelMessage = {
      id: messageId,
      userId: alice.userId,
      type: MessageType.Basic,
      message: '',
      createdAt: 8,
      channelId: currentChannel,
      media,
    }

    const reducer = combineReducers(testReducers)
    await expectSaga(
      sendMessageSaga,
      socket as unknown as Socket,
      messagesActions.sendMessage({ message: '', id: messageId, media })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .provide([
        [call.fn(generateMessageId), messageId],
        [call.fn(getCurrentTime), 8],
      ])
      .apply(socket, socket.emit, applyEmitParams(SocketActions.SEND_MESSAGE, expectedMessage))
      .run()
  })
})
