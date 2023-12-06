import { setupCrypto } from '@quiet/identity'
import { type Store } from '../../store.types'
import { getFactory } from '../../..'
import { prepareStore, reducers } from '../../../utils/tests/prepareStore'
import { expectSaga } from 'redux-saga-test-plan'
import { publicChannelsActions } from '../publicChannels.slice'
import { type communitiesActions } from '../../communities/communities.slice'
import { type FactoryGirl } from 'factory-girl'
import { combineReducers } from 'redux'
import { identityActions } from '../../identity/identity.slice'
import { DateTime } from 'luxon'
import { markUnreadChannelsSaga } from './markUnreadChannels.saga'
import { messagesActions } from '../../messages/messages.slice'
import { generateChannelId } from '@quiet/common'
import { type ChannelMessage, type Community, type Identity, MessageType } from '@quiet/types'

describe('markUnreadChannelsSaga', () => {
  let store: Store
  let factory: FactoryGirl

  let community: Community
  let alice: Identity

  let channelIds: string[] = []

  beforeAll(async () => {
    setupCrypto()

    store = prepareStore().store

    factory = await getFactory(store)

    community = await factory.create<ReturnType<typeof communitiesActions.storeCommunity>['payload']>('Community')

    alice = await factory.create<ReturnType<typeof identityActions.storeIdentity>['payload']>('Identity', {
      id: community.id,
      nickname: 'alice',
    })

    const channelNames = ['memes', 'enya', 'pets', 'travels']

    // Automatically create channels
    for (const name of channelNames) {
      const channel = await factory.create<ReturnType<typeof publicChannelsActions.addChannel>['payload']>(
        'PublicChannel',
        {
          channel: {
            name,
            description: `Welcome to #${name}`,
            timestamp: DateTime.utc().valueOf(),
            owner: alice.nickname,
            id: generateChannelId(name),
          },
        }
      )
      channelIds = [...channelIds, channel.channel.id]
    }
  })

  test('mark unread channels', async () => {
    const messagesides = channelIds
    const messages: ChannelMessage[] = []

    // Automatically create messages
    for (const id of messagesides) {
      const message = (
        await factory.build<typeof publicChannelsActions.test_message>('Message', {
          identity: alice,
          message: {
            id: Math.random().toString(36).substr(2.9),
            type: MessageType.Basic,
            message: 'message',
            createdAt: DateTime.utc().valueOf(),
            channelId: id,
            signature: '',
            pubKey: '',
          },
          verifyAutomatically: true,
        })
      ).payload.message
      messages.push(message)
    }

    // Set the newest message
    const channelId = channelIds.find(id => id.includes('enya'))
    if (!channelId) throw new Error('no channel id')
    const message = (
      await factory.create<ReturnType<typeof publicChannelsActions.test_message>['payload']>('Message', {
        identity: alice,
        message: {
          id: Math.random().toString(36).substr(2.9),
          type: MessageType.Basic,
          message: 'message',
          createdAt: 99999999999999,
          channelId,
          signature: '',
          pubKey: '',
        },
        verifyAutomatically: true,
      })
    ).message

    store.dispatch(publicChannelsActions.updateNewestMessage({ message }))

    const channelIdMemes = channelIds.find(id => id.includes('memes'))

    const channelIdEnya = channelIds.find(id => id.includes('enya'))

    const channelIdTravels = channelIds.find(id => id.includes('travels'))
    if (!channelIdMemes || !channelIdEnya || !channelIdTravels) throw new Error('no channel id')

    const reducer = combineReducers(reducers)
    await expectSaga(
      markUnreadChannelsSaga,
      messagesActions.incomingMessages({
        messages,
      })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .put(identityActions.verifyJoinTimestamp())
      .put(
        publicChannelsActions.markUnreadChannel({
          channelId: channelIdMemes,
          message: messages[0],
        })
      )
      .not.put(
        publicChannelsActions.markUnreadChannel({
          channelId: channelIdEnya,
          message: messages[2],
        })
      )
      .put(
        publicChannelsActions.markUnreadChannel({
          channelId: channelIdTravels,
          message: messages[3],
        })
      )
      .run()
  })

  test('do not mark unread channels if message is older than user', async () => {
    const messagesides = channelIds
    const messages: ChannelMessage[] = []

    const community =
      await factory.create<ReturnType<typeof communitiesActions.storeCommunity>['payload']>('Community')

    const alice = await factory.create<ReturnType<typeof identityActions.storeIdentity>['payload']>('Identity', {
      id: community.id,
      nickname: 'alice',
      joinTimestamp: 9239423949,
    })

    // Automatically create older messages
    for (const id of messagesides) {
      const message = (
        await factory.build<typeof publicChannelsActions.test_message>('Message', {
          identity: alice,
          message: {
            id: Math.random().toString(36).substr(2.9),
            type: MessageType.Basic,
            message: 'message',
            createdAt: 123,
            channelId: id,
            signature: '',
            pubKey: '',
          },
          verifyAutomatically: true,
        })
      ).payload.message
      messages.push(message)
    }

    const channelId = channelIds.find(id => id.includes('enya'))
    if (!channelId) throw new Error('no channel id')
    // Set the newest message
    const message = (
      await factory.create<ReturnType<typeof publicChannelsActions.test_message>['payload']>('Message', {
        identity: alice,
        message: {
          id: Math.random().toString(36).substr(2.9),
          type: MessageType.Basic,
          message: 'message',
          createdAt: 99999999999999,
          channelId,
          signature: '',
          pubKey: '',
        },
        verifyAutomatically: true,
      })
    ).message

    messages.push(message)

    const channelIdMemes = channelIds.find(id => id.includes('memes'))

    const channelIdEnya = channelIds.find(id => id.includes('enya'))

    const channelIdTravels = channelIds.find(id => id.includes('travels'))
    if (!channelIdMemes || !channelIdEnya || !channelIdTravels) throw new Error('no channel id')
    const reducer = combineReducers(reducers)
    await expectSaga(
      markUnreadChannelsSaga,
      messagesActions.incomingMessages({
        messages,
      })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .put(identityActions.verifyJoinTimestamp())
      .not.put(
        publicChannelsActions.markUnreadChannel({
          channelId: channelIdMemes,
          message: messages[1],
        })
      )
      .put(
        publicChannelsActions.markUnreadChannel({
          channelId: channelIdEnya,
          message,
        })
      )
      .not.put(
        publicChannelsActions.markUnreadChannel({
          channelId: channelIdTravels,
          message: messages[3],
        })
      )
      .run()
  })
})
