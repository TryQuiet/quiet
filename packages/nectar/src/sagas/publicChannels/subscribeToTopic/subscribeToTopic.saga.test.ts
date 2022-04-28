import { Socket } from 'socket.io-client'
import { setupCrypto } from '@quiet/identity'
import { Store } from '../../store.types'
import { getFactory, Identity, SocketActionTypes } from '../../..'
import { prepareStore, reducers } from '../../../utils/tests/prepareStore'
import { publicChannelsActions } from './../publicChannels.slice'
import { communitiesActions, Community } from '../../communities/communities.slice'
import { identityActions } from '../../identity/identity.slice'
import { FactoryGirl } from 'factory-girl'
import { combineReducers } from 'redux'
import { expectSaga } from 'redux-saga-test-plan'
import { subscribeToTopicSaga } from './subscribeToTopic.saga'
import { PublicChannel } from '../publicChannels.types'
import { selectGeneralChannel } from '../publicChannels.selectors'
import { messagesActions } from '../../messages/messages.slice'

describe('subscribeToTopicSaga', () => {
  const socket = { emit: jest.fn() } as unknown as Socket

  let store: Store
  let factory: FactoryGirl

  let community: Community

  let alice: Identity

  let generalChannel: PublicChannel

  beforeAll(async () => {
    setupCrypto()

    store = prepareStore().store

    factory = await getFactory(store)

    community = await factory.create<
    ReturnType<typeof communitiesActions.addNewCommunity>['payload']
    >('Community')

    generalChannel = {
      ...selectGeneralChannel(store.getState()),
      // @ts-ignore
      messages: undefined,
      messagesSlice: undefined
    }

    alice = await factory.create<ReturnType<typeof identityActions.addNewIdentity>['payload']>(
      'Identity',
      { id: community.id, nickname: 'alice' }
    )
  })

  test('subscribe to topic', async () => {
    const reducer = combineReducers(reducers)
    await expectSaga(
      subscribeToTopicSaga,
      socket,
      publicChannelsActions.subscribeToTopic({
        peerId: alice.peerId.id,
        channelData: generalChannel
      })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .put(
        publicChannelsActions.addChannel({
          communityId: community.id,
          channel: generalChannel
        })
      )
      .put(
        messagesActions.addPublicChannelsMessagesBase({
          channelAddress: generalChannel.address
        })
      )
      .apply(socket, socket.emit, [
        SocketActionTypes.SUBSCRIBE_TO_TOPIC,
        {
          peerId: alice.peerId.id,
          channelData: generalChannel
        }
      ])
      .run()
  })
})
