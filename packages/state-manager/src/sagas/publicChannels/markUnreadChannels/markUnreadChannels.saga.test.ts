import { setupCrypto } from '@quiet/identity'
import { Store } from '../../store.types'
import { getFactory, Community, ChannelMessage, MessageType } from '../../..'
import { prepareStore, reducers } from '../../../utils/tests/prepareStore'
import { expectSaga } from 'redux-saga-test-plan'
import { publicChannelsActions } from '../publicChannels.slice'
import { communitiesActions } from '../../communities/communities.slice'
import { FactoryGirl } from 'factory-girl'
import { combineReducers } from 'redux'
import { Identity } from '../../identity/identity.types'
import { identityActions } from '../../identity/identity.slice'
import { DateTime } from 'luxon'
import { markUnreadChannelsSaga } from './markUnreadChannels.saga'
import { messagesActions } from '../../messages/messages.slice'
import { generateChannelAddress } from '@quiet/common'

describe('markUnreadChannelsSaga', () => {
  let store: Store
  let factory: FactoryGirl

  let community: Community
  let alice: Identity
  let bob: Identity
  let channelAdresses: string[] = []

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

    const channelNames = ['memes', 'enya', 'pets', 'travels']

    // Automatically create channels
    for (const name of channelNames) {
      const channel = await factory.create<
        ReturnType<typeof publicChannelsActions.addChannel>['payload']
      >('PublicChannel', {
        channel: {
          name: name,
          description: `Welcome to #${name}`,
          timestamp: DateTime.utc().valueOf(),
          owner: alice.nickname,
          address: generateChannelAddress(name)
        }
      })
      channelAdresses = [...channelAdresses, channel.channel.address]
    }
  })

  test('mark unread channels', async () => {
    const messagesAddresses = channelAdresses
    const messages: ChannelMessage[] = []

    // Automatically create messages
    for (const address of messagesAddresses) {
      const message = (
        await factory.build<typeof publicChannelsActions.test_message>('Message', {
          identity: alice,
          message: {
            id: Math.random().toString(36).substr(2.9),
            type: MessageType.Basic,
            message: 'message',
            createdAt: DateTime.utc().valueOf(),
            channelAddress: address,
            signature: '',
            pubKey: ''
          },
          verifyAutomatically: true
        })
      ).payload.message
      messages.push(message)
    }

    // Set the newest message
    const message = (
      await factory.create<ReturnType<typeof publicChannelsActions.test_message>['payload']>(
        'Message',
        {
          identity: alice,
          message: {
            id: Math.random().toString(36).substr(2.9),
            type: MessageType.Basic,
            message: 'message',
            createdAt: 99999999999999,
            channelAddress: channelAdresses.find((address) => address.includes('enya')),
            signature: '',
            pubKey: ''
          },
          verifyAutomatically: true
        }
      )
    ).message

    store.dispatch(publicChannelsActions.updateNewestMessage({ message }))

    const reducer = combineReducers(reducers)
    await expectSaga(
      markUnreadChannelsSaga,
      messagesActions.incomingMessages({
        messages: messages
      })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .put(
        publicChannelsActions.markUnreadChannel({
          channelAddress: channelAdresses.find((address) => address.includes('memes')),
          message: messages[0]
        })
      )
      .not.put(
        publicChannelsActions.markUnreadChannel({
          channelAddress: channelAdresses.find((address) => address.includes('enya')),
          message: messages[2]
        })
      )
      .put(
        publicChannelsActions.markUnreadChannel({
          channelAddress: channelAdresses.find((address) => address.includes('travels')),
          message: messages[3]
        })
      )
      .run()
  })

  test('do not mark unread channels if message is older than user', async () => {
    const messagesAddresses = channelAdresses
    const messages: ChannelMessage[] = []

    const community = await factory.create<
      ReturnType<typeof communitiesActions.addNewCommunity>['payload']
    >('Community')

    const alice = await factory.create<
      ReturnType<typeof identityActions.addNewIdentity>['payload']
    >('Identity', { id: community.id, nickname: 'alice', joinTimestamp: 9239423949 })

    // Automatically create older messages
    for (const address of messagesAddresses) {
      const message = (
        await factory.build<typeof publicChannelsActions.test_message>('Message', {
          identity: alice,
          message: {
            id: Math.random().toString(36).substr(2.9),
            type: MessageType.Basic,
            message: 'message',
            createdAt: 123,
            channelAddress: address,
            signature: '',
            pubKey: ''
          },
          verifyAutomatically: true
        })
      ).payload.message
      messages.push(message)
    }

    // Set the newest message
    const message = (
      await factory.create<ReturnType<typeof publicChannelsActions.test_message>['payload']>(
        'Message',
        {
          identity: alice,
          message: {
            id: Math.random().toString(36).substr(2.9),
            type: MessageType.Basic,
            message: 'message',
            createdAt: 99999999999999,
            channelAddress: channelAdresses.find((address) => address.includes('enya')),
            signature: '',
            pubKey: ''
          },
          verifyAutomatically: true
        }
      )
    ).message

    messages.push(message)

    const reducer = combineReducers(reducers)
    await expectSaga(
      markUnreadChannelsSaga,
      messagesActions.incomingMessages({
        messages: messages
      })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .not.put(
        publicChannelsActions.markUnreadChannel({
          channelAddress: channelAdresses.find((address) => address.includes('memes')),
          message: messages[1]
        })
      )
      .put(
        publicChannelsActions.markUnreadChannel({
          channelAddress: channelAdresses.find((address) => address.includes('enya')),
          message: message
        })
      )
      .not.put(
        publicChannelsActions.markUnreadChannel({
          channelAddress: channelAdresses.find((address) => address.includes('travels')),
          message: messages[3]
        })
      )
      .run()
  })
})
