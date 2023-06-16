import { setupCrypto } from '@quiet/identity'
import { type Store } from '../../store.types'
import { getFactory } from '../../..'
import { prepareStore, reducers } from '../../../utils/tests/prepareStore'
import { expectSaga } from 'redux-saga-test-plan'
import { publicChannelsActions } from '../publicChannels.slice'
import { type communitiesActions } from '../../communities/communities.slice'
import { type FactoryGirl } from 'factory-girl'
import { combineReducers } from 'redux'
import { type identityActions } from '../../identity/identity.slice'
import { DateTime } from 'luxon'
import { updateNewestMessageSaga } from './updateNewestMessage.saga'
import { messagesActions } from '../../messages/messages.slice'
import { generateChannelId } from '@quiet/common'
import { publicChannelsSelectors } from '../publicChannels.selectors'
import { type ChannelMessage, type Community, type Identity, MessageType, type PublicChannel } from '@quiet/types'

describe('markUnreadChannelsSaga', () => {
  let store: Store
  let factory: FactoryGirl

  let community: Community
  let alice: Identity

  let generalChannel: PublicChannel

  let channelIds: string[] = []

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
    const generalChannelState = publicChannelsSelectors.generalChannel(store.getState())
    if (generalChannelState) generalChannel = generalChannelState
    expect(generalChannel).not.toBeUndefined()
    channelIds = [...channelIds, generalChannel.id]
    const channelNames = ['memes', 'pets', 'travels']

    // Automatically create channels
    for (const name of channelNames) {
      const channel = await factory.create<
        ReturnType<typeof publicChannelsActions.addChannel>['payload']
      >('PublicChannel', {
        channel: {
          name,
          description: `Welcome to #${name}`,
          timestamp: DateTime.utc().valueOf(),
          owner: alice.nickname,
          id: generateChannelId(name)
        }
      })
      channelIds = [...channelIds, channel.channel.id]
    }
  })

  test('Update newest message if there is no newest message', async () => {
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
        messages
      })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .put(publicChannelsActions.updateNewestMessage({ message: messages[0] }))
      .put(publicChannelsActions.updateNewestMessage({ message: messages[1] }))
      .run()
  })

  test('update newest message if incoming message is newer', async () => {
    const messagesides = [generalChannel.id]
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
            createdAt: 9999,
            channelId: generalChannel.id,
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
      updateNewestMessageSaga,
      messagesActions.incomingMessages({
        messages
      })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .put(publicChannelsActions.updateNewestMessage({ message: messages[0] }))
      .run()
  })
  test('do not update newest message if incoming message is older', async () => {
    const messagesides = [generalChannel.id]
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
            channelId: generalChannel.id,
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
      updateNewestMessageSaga,
      messagesActions.incomingMessages({
        messages
      })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .not.put(publicChannelsActions.updateNewestMessage({ message: messages[0] }))
      .run()
  })
})
