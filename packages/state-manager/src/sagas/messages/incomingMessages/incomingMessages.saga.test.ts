import { setupCrypto } from '@quiet/identity'
import { type FactoryGirl } from 'factory-girl'
import { expectSaga } from 'redux-saga-test-plan'
import { getFactory } from '../../../utils/tests/factories'
import { prepareStore } from '../../..//utils/tests/prepareStore'
import { combineReducers, type Store } from 'redux'
import { type communitiesActions } from '../../communities/communities.slice'
import { type identityActions } from '../../identity/identity.slice'
import { publicChannelsActions } from '../../publicChannels/publicChannels.slice'
import { publicChannelsSelectors, selectGeneralChannel } from '../../publicChannels/publicChannels.selectors'
import { DateTime } from 'luxon'
import { incomingMessagesSaga } from './incomingMessages.saga'
import { messagesActions } from '../messages.slice'
import { reducers } from '../../reducers'
import {
  type ChannelMessage,
  type Community,
  type FileMetadata,
  type Identity,
  MessageType,
  type PublicChannel,
} from '@quiet/types'
import { generateChannelId } from '@quiet/common'

describe('incomingMessagesSaga', () => {
  let store: Store
  let factory: FactoryGirl

  let community: Community
  let alice: Identity

  let generalChannel: PublicChannel
  let sailingChannel: PublicChannel
  let barbequeChannel: PublicChannel

  beforeAll(async () => {
    setupCrypto()

    store = prepareStore().store

    factory = await getFactory(store)

    community = await factory.create<ReturnType<typeof communitiesActions.storeCommunity>['payload']>('Community')

    alice = await factory.create<ReturnType<typeof identityActions.storeIdentity>['payload']>('Identity', {
      id: community.id,
      nickname: 'alice',
    })

    const generalChannelState = publicChannelsSelectors.generalChannel(store.getState())
    if (generalChannelState) generalChannel = generalChannelState
    expect(generalChannel).not.toBeUndefined()

    sailingChannel = (
      await factory.create<ReturnType<typeof publicChannelsActions.addChannel>['payload']>('PublicChannel', {
        channel: {
          name: 'sailing',
          description: 'Welcome to #sailing',
          timestamp: DateTime.utc().valueOf(),
          owner: alice.nickname,
          id: generateChannelId('sailing'),
        },
      })
    ).channel

    barbequeChannel = (
      await factory.create<ReturnType<typeof publicChannelsActions.addChannel>['payload']>('PublicChannel', {
        channel: {
          name: 'barbeque',
          description: 'Welcome to #barbeque',
          timestamp: DateTime.utc().valueOf(),
          owner: alice.nickname,
          id: generateChannelId('barbeque'),
        },
      })
    ).channel
  })

  test('put incoming messages in cache', async () => {
    const message = (
      await factory.build<typeof publicChannelsActions.test_message>('Message', {
        identity: alice,
        message: {
          id: Math.random().toString(36).substr(2.9),
          type: MessageType.Basic,
          message: 'message',
          createdAt: DateTime.utc().valueOf(),
          channelId: generalChannel.id,
          signature: '',
          pubKey: '',
        },
        verifyAutomatically: true,
      })
    ).payload.message

    // Set 'general' as active channel
    store.dispatch(
      publicChannelsActions.setCurrentChannel({
        channelId: generalChannel.id,
      })
    )

    // Verify cache in empty
    expect(publicChannelsSelectors.sortedCurrentChannelMessages(store.getState())).toStrictEqual([])

    const reducer = combineReducers(reducers)
    await expectSaga(
      incomingMessagesSaga,
      messagesActions.incomingMessages({
        messages: [message],
      })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .put(
        publicChannelsActions.cacheMessages({
          messages: [message],
          channelId: message.channelId,
        })
      )
      .run()
  })

  test("update message after downloading it's media", async () => {
    const id = Math.random().toString(36).substr(2.9)

    let message = (
      await factory.build<typeof publicChannelsActions.test_message>('Message', {
        identity: alice,
        message: {
          id,
          type: MessageType.Basic,
          message: 'message',
          createdAt: DateTime.utc().valueOf(),
          channelId: generalChannel.id,
          signature: '',
          pubKey: '',
        },
        verifyAutomatically: true,
      })
    ).payload.message

    const media: FileMetadata = {
      cid: 'cid',
      path: null,
      name: 'image',
      ext: 'png',
      message: {
        id,
        channelId: generalChannel.id,
      },
    }

    message = {
      ...message,
      media,
    }

    // Set 'general' as active channel
    store.dispatch(
      publicChannelsActions.setCurrentChannel({
        channelId: generalChannel.id,
      })
    )

    // Store message in cache (by default)
    store.dispatch(
      publicChannelsActions.cacheMessages({
        messages: [message],
        channelId: generalChannel.id,
      })
    )

    // Enhance media payload with path
    message = {
      ...message,
      media: {
        ...media,
        path: 'dir/image.png',
      },
    }

    const reducer = combineReducers(reducers)
    await expectSaga(
      incomingMessagesSaga,
      messagesActions.incomingMessages({
        messages: [message],
      })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .put(
        publicChannelsActions.cacheMessages({
          messages: [message],
          channelId: message.channelId,
        })
      )
      .run()
  })

  test("update message after uploading it's media", async () => {
    const id = Math.random().toString(36).substr(2.9)
    const media = {
      cid: 'uploading',
      path: 'path/to/image.png',
      name: 'image',
      ext: 'png',
      message: {
        id,
        channelId: generalChannel.id,
      },
    }
    const message = (
      await factory.create<ReturnType<typeof publicChannelsActions.test_message>['payload']>('Message', {
        identity: alice,
        message: {
          id,
          type: MessageType.Basic,
          message: 'message',
          createdAt: DateTime.utc().valueOf(),
          channelId: generalChannel.id,
          media: {
            cid: 'uploading',
            path: 'path/to/image.png',
            name: 'image',
            ext: 'png',
            message: {
              id,
              channelId: generalChannel.id,
            },
          },
          signature: '',
          pubKey: '',
        },
        verifyAutomatically: true,
      })
    ).message

    // Set 'general' as active channel
    store.dispatch(
      publicChannelsActions.setCurrentChannel({
        channelId: generalChannel.id,
      })
    )

    // Store message in cache (by default)
    store.dispatch(
      publicChannelsActions.cacheMessages({
        messages: [message],
        channelId: generalChannel.id,
      })
    )

    const reducer = combineReducers(reducers)
    await expectSaga(
      incomingMessagesSaga,
      messagesActions.incomingMessages({
        messages: [
          {
            ...message,
            media: {
              ...media,
              cid: 'cid',
              path: null,
            },
          },
        ],
      })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .put(
        publicChannelsActions.cacheMessages({
          messages: [
            {
              ...message,
              media: {
                ...media,
                cid: 'cid',
                path: 'path/to/image.png',
              },
            },
          ],
          channelId: message.channelId,
        })
      )
      .run()
  })

  test('do nothing for messages from non-active channel', async () => {
    const message = (
      await factory.build<typeof publicChannelsActions.test_message>('Message', {
        identity: alice,
        message: {
          id: Math.random().toString(36).substr(2.9),
          type: MessageType.Basic,
          message: 'message',
          createdAt: DateTime.utc().valueOf(),
          channelId: sailingChannel.id,
          signature: '',
          pubKey: '',
        },
        verifyAutomatically: true,
      })
    ).payload.message

    // Set 'general' as active channel
    store.dispatch(
      publicChannelsActions.setCurrentChannel({
        channelId: generalChannel.id,
      })
    )

    const reducer = combineReducers(reducers)
    await expectSaga(
      incomingMessagesSaga,
      messagesActions.incomingMessages({
        messages: [message],
      })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .not.put(
        publicChannelsActions.cacheMessages({
          messages: [message],
          channelId: message.channelId,
        })
      )
      .run()
  })

  test('filter out messages with invalid signature', async () => {
    const message = (
      await factory.build<typeof publicChannelsActions.test_message>('Message', {
        identity: alice,
        message: {
          id: Math.random().toString(36).substr(2.9),
          type: MessageType.Basic,
          message: 'message',
          createdAt: DateTime.utc().valueOf(),
          channelId: generalChannel.id,
          signature: '',
          pubKey: '',
        },
        verifyAutomatically: false,
      })
    ).payload.message

    // Mark message as unverified
    store.dispatch(
      messagesActions.addMessageVerificationStatus({
        publicKey: message.pubKey,
        signature: message.signature,
        isVerified: false,
      })
    )

    // Set 'general' as active channel
    store.dispatch(
      publicChannelsActions.setCurrentChannel({
        channelId: generalChannel.id,
      })
    )

    const reducer = combineReducers(reducers)
    await expectSaga(
      incomingMessagesSaga,
      messagesActions.incomingMessages({
        messages: [message],
      })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .not.put(
        publicChannelsActions.cacheMessages({
          messages: [message],
          channelId: message.channelId,
        })
      )
      .run()
  })

  test('ignore messages older than last displayed message', async () => {
    // Construct tested message before others
    const message = (
      await factory.build<typeof publicChannelsActions.test_message>('Message', {
        identity: alice,
        message: {
          id: Math.random().toString(36).substr(2.9),
          type: MessageType.Basic,
          message: 'message',
          createdAt: DateTime.utc().valueOf() - DateTime.utc().minus({ days: 1 }).valueOf(),
          channelId: barbequeChannel.id,
          signature: '',
          pubKey: '',
        },
        verifyAutomatically: true,
      })
    ).payload.message

    // Set 'barbeque' as active channel
    store.dispatch(
      publicChannelsActions.setCurrentChannel({
        channelId: barbequeChannel.id,
      })
    )

    // Populate cache with messages
    const messages: ChannelMessage[] = []
    await new Promise(resolve => {
      const iterations = 50
      ;[...Array(iterations)].map(async (_, index) => {
        const item = (
          await factory.build<typeof publicChannelsActions.test_message>('Message', {
            identity: alice,
            message: {
              id: Math.random().toString(36).substr(2.9),
              type: MessageType.Basic,
              message: 'message',
              createdAt: DateTime.utc().valueOf() + DateTime.utc().minus({ minutes: index }).valueOf(),
              channelId: barbequeChannel.id,
              signature: '',
              pubKey: '',
            },
            verifyAutomatically: true,
          })
        ).payload.message
        messages.push(item)
        if (messages.length === iterations) {
          resolve(true)
        }
      })
    })

    await factory.create<ReturnType<typeof publicChannelsActions.cacheMessages>['payload']>('CacheMessages', {
      messages,
      channelId: barbequeChannel.id,
    })

    // Confirm cache is full (contains maximum number of messages to display)
    const cachedMessages = publicChannelsSelectors.sortedCurrentChannelMessages(store.getState())
    expect(cachedMessages.length).toBe(50)

    const reducer = combineReducers(reducers)
    await expectSaga(
      incomingMessagesSaga,
      messagesActions.incomingMessages({
        messages: [message],
      })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .not.put(publicChannelsActions.cacheMessages({ messages, channelId: barbequeChannel.id }))
      .run()

    // Verify cached messages hasn't changed
    expect(publicChannelsSelectors.sortedCurrentChannelMessages(store.getState())).toStrictEqual(cachedMessages)
  })

  test("don't ignore older messages before reaching maximum messages display number", async () => {
    // Construct tested message before others
    const message = (
      await factory.build<typeof publicChannelsActions.test_message>('Message', {
        identity: alice,
        message: {
          id: Math.random().toString(36).substr(2.9),
          type: MessageType.Basic,
          message: 'message',
          createdAt: DateTime.utc().valueOf() - DateTime.utc().minus({ days: 1 }).valueOf(),
          channelId: generalChannel.id,
          signature: '',
          pubKey: '',
        },
        verifyAutomatically: true,
      })
    ).payload.message

    // Set 'general' as active channel
    store.dispatch(
      publicChannelsActions.setCurrentChannel({
        channelId: generalChannel.id,
      })
    )

    // Populate cache with messages
    const messages: ChannelMessage[] = []
    await new Promise(resolve => {
      const iterations = 2
      ;[...Array(iterations)].map(async (_, index) => {
        const item = (
          await factory.build<typeof publicChannelsActions.test_message>('Message', {
            identity: alice,
            message: {
              id: Math.random().toString(36).substr(2.9),
              type: MessageType.Basic,
              message: 'message',
              createdAt: DateTime.utc().valueOf() + DateTime.utc().minus({ minutes: index }).valueOf(),
              channelId: generalChannel.id,
              signature: '',
              pubKey: '',
            },
            verifyAutomatically: true,
          })
        ).payload.message
        messages.push(item)
        if (messages.length === iterations) {
          resolve(true)
        }
      })
    })

    await factory.create<ReturnType<typeof publicChannelsActions.cacheMessages>['payload']>('CacheMessages', {
      messages,
      channelId: generalChannel.id,
    })

    // Confirm cache is not full (contains maximum number of messages to display)
    const cachedMessages = publicChannelsSelectors.sortedCurrentChannelMessages(store.getState())
    expect(cachedMessages.length).toBeLessThan(50)

    // Prepare array for assertion
    const updatedCache = cachedMessages.map(message => message)
    updatedCache.push(message)

    const reducer = combineReducers(reducers)
    await expectSaga(
      incomingMessagesSaga,
      messagesActions.incomingMessages({
        messages: [message],
      })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .put(
        publicChannelsActions.cacheMessages({
          messages: updatedCache,
          channelId: message.channelId,
        })
      )
      .run()
  })
})
