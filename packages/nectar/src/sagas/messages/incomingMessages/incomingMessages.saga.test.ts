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
import { PublicChannel } from '../../publicChannels/publicChannels.types'
import {
  publicChannelsSelectors,
  selectGeneralChannel
} from '../../publicChannels/publicChannels.selectors'
import { DateTime } from 'luxon'
import { incomingMessagesSaga } from './incomingMessages.saga'
import { messagesActions } from '../messages.slice'
import { reducers } from '../../reducers'

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
          communityId: alice.id,
          channel: {
            name: 'sailing',
            description: 'Welcome to #sailing',
            timestamp: DateTime.utc().valueOf(),
            owner: alice.nickname,
            address: 'sailing'
          }
        }
      )
    ).channel

    barbequeChannel = (
      await factory.create<ReturnType<typeof publicChannelsActions.addChannel>['payload']>(
        'PublicChannel',
        {
          communityId: alice.id,
          channel: {
            name: 'barbeque',
            description: 'Welcome to #barbeque',
            timestamp: DateTime.utc().valueOf(),
            owner: alice.nickname,
            address: 'barbeque'
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
        channelAddress: generalChannel.address,
        communityId: community.id
      })
    )

    // Verify cache in empty
    expect(publicChannelsSelectors.sortedCurrentChannelMessages(store.getState())).toStrictEqual([])

    const reducer = combineReducers(reducers)
    await expectSaga(
      incomingMessagesSaga,
      messagesActions.incomingMessages({
        messages: [message],
        communityId: community.id
      })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .put(
        publicChannelsActions.cacheMessages({
          messages: [message],
          channelAddress: message.channelAddress,
          communityId: community.id
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
        channelAddress: generalChannel.address,
        communityId: community.id
      })
    )

    const reducer = combineReducers(reducers)
    await expectSaga(
      incomingMessagesSaga,
      messagesActions.incomingMessages({
        messages: [message],
        communityId: community.id
      })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .not.put(
        publicChannelsActions.cacheMessages({
          messages: [message],
          channelAddress: message.channelAddress,
          communityId: community.id
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
        verified: false
      })
    )

    // Set 'general' as active channel
    store.dispatch(
      publicChannelsActions.setCurrentChannel({
        channelAddress: generalChannel.address,
        communityId: community.id
      })
    )

    const reducer = combineReducers(reducers)
    await expectSaga(
      incomingMessagesSaga,
      messagesActions.incomingMessages({
        messages: [message],
        communityId: community.id
      })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .not.put(
        publicChannelsActions.cacheMessages({
          messages: [message],
          channelAddress: message.channelAddress,
          communityId: community.id
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
          createdAt: DateTime.utc().valueOf(),
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
        channelAddress: barbequeChannel.address,
        communityId: community.id
      })
    )

    // Populate cache with messages
    ;[...Array(50)].map(async (_, index) => {
      await factory.create<ReturnType<typeof publicChannelsActions.test_message>['payload']>(
        'Message',
        {
          identity: alice,
          message: {
            id: Math.random().toString(36).substr(2.9),
            type: MessageType.Basic,
            message: 'message',
            createdAt: DateTime.utc().valueOf() + ++index,
            channelAddress: barbequeChannel.address,
            signature: '',
            pubKey: ''
          },
          verifyAutomatically: true
        }
      )
    })

    // Confirm cache is full (contains maximum number of messages to display)
    const cachedMessages = publicChannelsSelectors.sortedCurrentChannelMessages(store.getState())
    expect(cachedMessages.length).toBe(50)

    const reducer = combineReducers(reducers)
    await expectSaga(
      incomingMessagesSaga,
      messagesActions.incomingMessages({
        messages: [message],
        communityId: community.id
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
})
