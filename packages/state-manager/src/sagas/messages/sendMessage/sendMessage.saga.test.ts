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

import { generateChannelId } from '@quiet/common'

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
          id: generateChannelId('sailing'),
        },
      })
    ).channel
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

  test('do not broadcast message until file is uploaded', async () => {
    const messageId = Math.random().toString(36).substr(2.9)
    const currentChannel = currentChannelId(store.getState())
    if (!currentChannel) {
      throw new Error('no currentChannel')
    }

    const media: FileMetadata = {
      cid: 'cid',
      path: `uploading_${messageId}`,
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
})
