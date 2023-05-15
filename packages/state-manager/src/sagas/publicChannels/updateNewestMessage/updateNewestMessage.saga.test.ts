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
import { updateNewestMessageSaga } from './updateNewestMessage.saga'
import { messagesActions } from '../../messages/messages.slice'
import { generateChannelAddress } from '@quiet/common'

describe('markUnreadChannelsSaga', () => {
  let store: Store
  let factory: FactoryGirl

  let community: Community
  let alice: Identity

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

    const channelNames = ['memes', 'pets', 'travels']

    // Automatically create channels
    for (const name of channelNames) {
      await factory.create<ReturnType<typeof publicChannelsActions.addChannel>['payload']>(
        'PublicChannel',
        {
          channel: {
            name: name,
            description: `Welcome to #${name}`,
            timestamp: DateTime.utc().valueOf(),
            owner: alice.nickname,
            address: generateChannelAddress(name)
          }
        }
      )
    }
  })

  test('Update newest message if there is no newest message', async () => {
    const messagesAddresses = ['general', 'memes']
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

    const reducer = combineReducers(reducers)
    await expectSaga(
      updateNewestMessageSaga,
      messagesActions.incomingMessages({
        messages: messages
      })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .put(
        publicChannelsActions.updateNewestMessage({ message: messages[0] })
      )
      .put(
        publicChannelsActions.updateNewestMessage({ message: messages[1] })
      )
      .run()
  })

  test('update newest message if incoming message is newer', async () => {
    const messagesAddresses = ['general']
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
    const message = (await factory.create<
      ReturnType<typeof publicChannelsActions.test_message>['payload']
      >('Message', {
        identity: alice,
        message: {
          id: Math.random().toString(36).substr(2.9),
          type: MessageType.Basic,
          message: 'message',
          createdAt: 9999,
          channelAddress: 'general',
          signature: '',
          pubKey: ''
        },
        verifyAutomatically: true
      })).message

      store.dispatch(publicChannelsActions.updateNewestMessage({ message }))

    const reducer = combineReducers(reducers)
    await expectSaga(
      updateNewestMessageSaga,
      messagesActions.incomingMessages({
        messages: messages
      })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .put(
        publicChannelsActions.updateNewestMessage({ message: messages[0] })
      )
      .run()
  })
  test('do not update newest message if incoming message is older', async () => {
    const messagesAddresses = ['general']
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
    const message = (await factory.create<
      ReturnType<typeof publicChannelsActions.test_message>['payload']
      >('Message', {
        identity: alice,
        message: {
          id: Math.random().toString(36).substr(2.9),
          type: MessageType.Basic,
          message: 'message',
          createdAt: 99999999999999,
          channelAddress: 'general',
          signature: '',
          pubKey: ''
        },
        verifyAutomatically: true
      })).message

      store.dispatch(publicChannelsActions.updateNewestMessage({ message }))

    const reducer = combineReducers(reducers)
    await expectSaga(
      updateNewestMessageSaga,
      messagesActions.incomingMessages({
        messages: messages
      })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .not
      .put(
        publicChannelsActions.updateNewestMessage({ message: messages[0] })
      )
      .run()
  })
})
