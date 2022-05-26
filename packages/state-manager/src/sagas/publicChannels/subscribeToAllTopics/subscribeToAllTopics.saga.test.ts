import { setupCrypto } from '@quiet/identity'
import { Store } from '../../store.types'
import { getFactory } from '../../..'
import { prepareStore, reducers } from '../../../utils/tests/prepareStore'
import { communitiesActions, Community } from '../../communities/communities.slice'
import { identityActions } from '../../identity/identity.slice'
import { Identity } from '../../identity/identity.types'
import { FactoryGirl } from 'factory-girl'
import { combineReducers } from 'redux'
import { expectSaga } from 'redux-saga-test-plan'
import { PublicChannel } from '../../publicChannels/publicChannels.types'
import { publicChannelsActions } from '../../publicChannels/publicChannels.slice'
import { selectGeneralChannel } from '../publicChannels.selectors'
import { subscribeToAllTopicsSaga } from './subscribeToAllTopics.saga'
import { DateTime } from 'luxon'

describe('subscribeToAllTopicsSaga', () => {
  let store: Store
  let factory: FactoryGirl

  let community: Community
  let alice: Identity

  let generalChannel: PublicChannel
  let sailingChannel: PublicChannel

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

    generalChannel = {
      ...selectGeneralChannel(store.getState()),
      // @ts-ignore
      messages: undefined,
      messagesSlice: undefined
    }

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

    sailingChannel = {
      ...sailingChannel,
      // @ts-ignore
      messages: undefined,
      messagesSlice: undefined
    }
  })

  test('subscribe to all topics', async () => {
    const reducer = combineReducers(reducers)
    await expectSaga(subscribeToAllTopicsSaga)
      .withReducer(reducer)
      .withState(store.getState())
      .put(
        publicChannelsActions.subscribeToTopic({
          peerId: alice.peerId.id,
          channelData: generalChannel
        })
      )
      .put(
        publicChannelsActions.subscribeToTopic({
          peerId: alice.peerId.id,
          channelData: sailingChannel
        })
      )
      .run()
  })
})
