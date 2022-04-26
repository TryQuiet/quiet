import { Socket } from 'socket.io-client'
import { setupCrypto } from '@quiet/identity'
import { Store } from '../../store.types'
import { getFactory, Identity, publicChannels, SocketActionTypes } from '../../..'
import { prepareStore, reducers } from '../../../utils/tests/prepareStore'
import { publicChannelsActions } from './../publicChannels.slice'
import { communitiesActions, Community } from '../../communities/communities.slice'
import { identityActions } from '../../identity/identity.slice'
import { FactoryGirl } from 'factory-girl'
import { combineReducers } from 'redux'
import { expectSaga } from 'redux-saga-test-plan'
import { subscribeToTopicSaga } from './subscribeToTopic.saga'
import { PublicChannel } from '../publicChannels.types'

describe('subscribeToTopicSaga', () => {
  const socket = { emit: jest.fn() } as unknown as Socket

  let store: Store
  let factory: FactoryGirl

  let community: Community
  let alice: Identity
  let channel: PublicChannel

  beforeAll(async () => {
    setupCrypto()

    store = prepareStore().store

    factory = await getFactory(store)

    community = await factory.create<
    ReturnType<typeof communitiesActions.addNewCommunity>['payload']
    >('Community')

    channel = publicChannels.selectors.publicChannels(store.getState())[0]

    alice = await factory.create<ReturnType<typeof identityActions.addNewIdentity>['payload']>(
      'Identity',
      { id: community.id, nickname: 'alice' }
    )
  })

  test('subscribe for topic', async () => {
    const reducer = combineReducers(reducers)
    await expectSaga(
      subscribeToTopicSaga,
      socket,
      publicChannelsActions.subscribeToTopic({
        peerId: alice.peerId.id,
        channelData: channel
      })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .put(
        publicChannelsActions.addChannel({
          communityId: community.id,
          channel: channel
        })
      )
      .apply(socket, socket.emit, [
        SocketActionTypes.SUBSCRIBE_TO_TOPIC,
        {
          peerId: alice.peerId.id,
          channelData: {
            ...channel,
            messagesSlice: undefined
          }
        }
      ])
      .run()
  })
})
