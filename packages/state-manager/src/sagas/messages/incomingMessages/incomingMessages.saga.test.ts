import { setupCrypto } from '@quiet/identity'
import { FactoryGirl } from 'factory-girl'
import { expectSaga } from 'redux-saga-test-plan'
import { getFactory } from '../../../utils/tests/factories'
import { prepareStore } from '../../..//utils/tests/prepareStore'
import { combineReducers, Store } from 'redux'
import { Community, communitiesActions } from '../../communities/communities.slice'
import { identityActions } from '../../identity/identity.slice'
import { Identity } from '../../identity/identity.types'
import { MessageType } from '../messages.types'
import { publicChannelsActions } from '../../publicChannels/publicChannels.slice'
import { ChannelMessage, PublicChannel } from '../../publicChannels/publicChannels.types'
import {
  publicChannelsSelectors,
  selectGeneralChannel
} from '../../publicChannels/publicChannels.selectors'
import { DateTime } from 'luxon'
import { incomingMessagesSaga } from './incomingMessages.saga'
import { messagesActions } from '../messages.slice'
import { reducers } from '../../reducers'
import { FileMetadata } from '../../files/files.types'
import { generateChannelAddress } from '@quiet/common'

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

    community = await factory.create<
    ReturnType<typeof communitiesActions.addNewCommunity>['payload']
    >('Community')

    alice = await factory.create<ReturnType<typeof identityActions.addNewIdentity>['payload']>(
      'Identity',
      { id: community.id, nickname: 'alice' }
    )

    generalChannel = selectGeneralChannel(store.getState())

    sailingChannel = (
      await factory.create<ReturnType<typeof publicChannelsActions.addChannel>['payload']>(
        'PublicChannel',
        {
          channel: {
            name: 'sailing',
            description: 'Welcome to #sailing',
            timestamp: DateTime.utc().valueOf(),
            owner: alice.nickname,
            address: generateChannelAddress('sailing')
          }
        }
      )
    ).channel

    barbequeChannel = (
      await factory.create<ReturnType<typeof publicChannelsActions.addChannel>['payload']>(
        'PublicChannel',
        {
          channel: {
            name: 'barbeque',
            description: 'Welcome to #barbeque',
            timestamp: DateTime.utc().valueOf(),
            owner: alice.nickname,
            address: generateChannelAddress('barbeque')
          }
        }
      )
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
          channelAddress: generalChannel.address,
          signature: '',
          pubKey: ''
        },
        verifyAutomatically: true
      })
    ).payload.message

    // Set 'general' as active channel
    store.dispatch(
      publicChannelsActions.setCurrentChannel({
        channelAddress: generalChannel.address
      })
    )

    // Verify cache in empty
    expect(publicChannelsSelectors.sortedCurrentChannelMessages(store.getState())).toStrictEqual([])

    const reducer = combineReducers(reducers)
    await expectSaga(
      incomingMessagesSaga,
      messagesActions.incomingMessages({
        messages: [message]
      })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .put(
        publicChannelsActions.cacheMessages({
          messages: [message],
          channelAddress: message.channelAddress
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
          id: id,
          type: MessageType.Basic,
          message: 'message',
          createdAt: DateTime.utc().valueOf(),
          channelAddress: generalChannel.address,
          signature: '',
          pubKey: ''
        },
        verifyAutomatically: true
      })
    ).payload.message

    const media: FileMetadata = {
      cid: 'cid',
      path: null,
      name: 'image',
      ext: 'png',
      message: {
        id: id,
        channelAddress: generalChannel.address
      }
    }

    message = {
      ...message,
      media: media
    }

    // Set 'general' as active channel
    store.dispatch(
      publicChannelsActions.setCurrentChannel({
        channelAddress: generalChannel.address
      })
    )

    // Store message in cache (by default)
    store.dispatch(
      publicChannelsActions.cacheMessages({
        messages: [message],
        channelAddress: generalChannel.address
      })
    )

    // Enhance media payload with path
    message = {
      ...message,
      media: {
        ...media,
        path: 'dir/image.png'
      }
    }

    const reducer = combineReducers(reducers)
    await expectSaga(
      incomingMessagesSaga,
      messagesActions.incomingMessages({
        messages: [message]
      })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .put(
        publicChannelsActions.cacheMessages({
          messages: [message],
          channelAddress: message.channelAddress
        })
      )
      .run()
  })

  test("update message after uploading it's media", async () => {
    const id = Math.random().toString(36).substr(2.9)

    const message = (
      await factory.create<ReturnType<typeof publicChannelsActions.test_message>['payload']>('Message', {
        identity: alice,
        message: {
          id: id,
          type: MessageType.Basic,
          message: 'message',
          createdAt: DateTime.utc().valueOf(),
          channelAddress: generalChannel.address,
          media: {
            cid: 'uploading',
            path: 'path/to/image.png',
            name: 'image',
            ext: 'png',
            message: {
              id: id,
              channelAddress: generalChannel.address
            }
          },
          signature: '',
          pubKey: ''
        },
        verifyAutomatically: true
      })
    ).message

    // Set 'general' as active channel
    store.dispatch(
      publicChannelsActions.setCurrentChannel({
        channelAddress: generalChannel.address
      })
    )

    // Store message in cache (by default)
    store.dispatch(
      publicChannelsActions.cacheMessages({
        messages: [message],
        channelAddress: generalChannel.address
      })
    )

    const reducer = combineReducers(reducers)
    await expectSaga(
      incomingMessagesSaga,
      messagesActions.incomingMessages({
        messages: [{
          ...message,
          media: {
            ...message.media,
            cid: 'cid',
            path: null
          }
        }]
      })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .put(
        publicChannelsActions.cacheMessages({
          messages: [{
            ...message,
            media: {
              ...message.media,
              cid: 'cid',
              path: 'path/to/image.png'
            }
          }],
          channelAddress: message.channelAddress
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
          channelAddress: sailingChannel.address,
          signature: '',
          pubKey: ''
        },
        verifyAutomatically: true
      })
    ).payload.message

    // Set 'general' as active channel
    store.dispatch(
      publicChannelsActions.setCurrentChannel({
        channelAddress: generalChannel.address
      })
    )

    const reducer = combineReducers(reducers)
    await expectSaga(
      incomingMessagesSaga,
      messagesActions.incomingMessages({
        messages: [message]
      })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .not.put(
        publicChannelsActions.cacheMessages({
          messages: [message],
          channelAddress: message.channelAddress
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
          channelAddress: generalChannel.address,
          signature: '',
          pubKey: ''
        },
        verifyAutomatically: false
      })
    ).payload.message

    // Mark message as unverified
    store.dispatch(
      messagesActions.addMessageVerificationStatus({
        publicKey: message.pubKey,
        signature: message.signature,
        isVerified: false
      })
    )

    // Set 'general' as active channel
    store.dispatch(
      publicChannelsActions.setCurrentChannel({
        channelAddress: generalChannel.address
      })
    )

    const reducer = combineReducers(reducers)
    await expectSaga(
      incomingMessagesSaga,
      messagesActions.incomingMessages({
        messages: [message]
      })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .not.put(
        publicChannelsActions.cacheMessages({
          messages: [message],
          channelAddress: message.channelAddress
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
          channelAddress: barbequeChannel.address,
          signature: '',
          pubKey: ''
        },
        verifyAutomatically: true
      })
    ).payload.message

    // Set 'barbeque' as active channel
    store.dispatch(
      publicChannelsActions.setCurrentChannel({
        channelAddress: barbequeChannel.address
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
              createdAt:
                DateTime.utc().valueOf() + DateTime.utc().minus({ minutes: index }).valueOf(),
              channelAddress: barbequeChannel.address,
              signature: '',
              pubKey: ''
            },
            verifyAutomatically: true
          })
        ).payload.message
        messages.push(item)
        if (messages.length === iterations) {
          resolve(true)
        }
      })
    })

    await factory.create<ReturnType<typeof publicChannelsActions.cacheMessages>['payload']>(
      'CacheMessages',
      {
        messages: messages,
        channelAddress: barbequeChannel.address
      }
    )

    // Confirm cache is full (contains maximum number of messages to display)
    const cachedMessages = publicChannelsSelectors.sortedCurrentChannelMessages(store.getState())
    expect(cachedMessages.length).toBe(50)

    const reducer = combineReducers(reducers)
    await expectSaga(
      incomingMessagesSaga,
      messagesActions.incomingMessages({
        messages: [message]
      })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .not.put(publicChannelsActions.cacheMessages())
      .run()

    // Verify cached messages hasn't changed
    expect(publicChannelsSelectors.sortedCurrentChannelMessages(store.getState())).toStrictEqual(
      cachedMessages
    )
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
          channelAddress: generalChannel.address,
          signature: '',
          pubKey: ''
        },
        verifyAutomatically: true
      })
    ).payload.message

    // Set 'general' as active channel
    store.dispatch(
      publicChannelsActions.setCurrentChannel({
        channelAddress: generalChannel.address
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
              createdAt:
                DateTime.utc().valueOf() + DateTime.utc().minus({ minutes: index }).valueOf(),
              channelAddress: generalChannel.address,
              signature: '',
              pubKey: ''
            },
            verifyAutomatically: true
          })
        ).payload.message
        messages.push(item)
        if (messages.length === iterations) {
          resolve(true)
        }
      })
    })

    await factory.create<ReturnType<typeof publicChannelsActions.cacheMessages>['payload']>(
      'CacheMessages',
      {
        messages: messages,
        channelAddress: generalChannel.address
      }
    )

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
        messages: [message]
      })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .put(
        publicChannelsActions.cacheMessages({
          messages: updatedCache,
          channelAddress: message.channelAddress
        })
      )
      .run()
  })
})
