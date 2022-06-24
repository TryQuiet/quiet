import { setupCrypto } from '@quiet/identity'
import { Store } from '../../store.types'
import { prepareStore } from '../../../utils/tests/prepareStore'
import { getFactory, PublicChannel } from '../../..'
import { FactoryGirl } from 'factory-girl'
import { combineReducers } from 'redux'
import { reducers } from '../../reducers'
import { expectSaga } from 'redux-saga-test-plan'
import { publicChannelsActions } from './../publicChannels.slice'
import { Identity } from '../../identity/identity.types'
import { identityActions } from '../../identity/identity.slice'
import { communitiesActions, Community } from '../../communities/communities.slice'
import { channelsReplicatedSaga } from './channelsReplicated.saga'
import { DateTime } from 'luxon'
import { publicChannelsSelectors } from '../publicChannels.selectors'

describe('channelsReplicatedSaga', () => {
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

    generalChannel = publicChannelsSelectors.currentChannel(store.getState())

    sailingChannel = (
      await factory.build<typeof publicChannelsActions.addChannel>('PublicChannel', {
        communityId: community.id,
        channel: {
          name: 'sailing',
          description: 'Welcome to #sailing',
          timestamp: DateTime.utc().valueOf(),
          owner: 'owner',
          address: 'sailing'
        }
      })
    ).payload.channel
  })

  test('save replicated channels in local storage', async () => {
    const reducer = combineReducers(reducers)
    await expectSaga(
      channelsReplicatedSaga,
      publicChannelsActions.channelsReplicated({
        channels: {
          [sailingChannel.address]: sailingChannel
        }
      })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .put(
        publicChannelsActions.addChannel({
          channel: sailingChannel
        })
      )
      .run()
  })

  test('do not modify already stored channel', async () => {
    const reducer = combineReducers(reducers)
    await expectSaga(
      channelsReplicatedSaga,
      publicChannelsActions.channelsReplicated({
        channels: {
          [generalChannel.address]: generalChannel,
          [sailingChannel.address]: sailingChannel
        }
      })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .not.put(
        publicChannelsActions.addChannel({
          channel: generalChannel
        })
      )
      .put(
        publicChannelsActions.addChannel({
          channel: sailingChannel
        })
      )
      .run()
  })

  test('subscribe to replicated channels', async () => {
    const reducer = combineReducers(reducers)
    await expectSaga(
      channelsReplicatedSaga,
      publicChannelsActions.channelsReplicated({
        channels: {
          [sailingChannel.address]: sailingChannel
        }
      })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .put(
        publicChannelsActions.addChannel({
          channel: sailingChannel
        })
      )
      .put(
        publicChannelsActions.subscribeToTopic({
          peerId: alice.peerId.id,
          channel: {
            ...sailingChannel,
            // @ts-ignore - Setting channel values undefined causes payload typing mismatch
            messages: undefined,
            messagesSlice: undefined
          }
        })
      )
      .run()
  })

  test('do not subscribe to already subscribed channel', async () => {
    const reducer = combineReducers(reducers)
    await expectSaga(
      channelsReplicatedSaga,
      publicChannelsActions.channelsReplicated({
        channels: {
          [generalChannel.address]: generalChannel,
          [sailingChannel.address]: sailingChannel
        }
      })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .put(
        publicChannelsActions.addChannel({
          channel: sailingChannel
        })
      )
      .not.put(
        publicChannelsActions.subscribeToTopic({
          peerId: alice.peerId.id,
          channel: {
            ...generalChannel,
            // @ts-ignore - Setting channel values undefined causes payload typing mismatch
            messages: undefined,
            messagesSlice: undefined
          }
        })
      )
      .put(
        publicChannelsActions.subscribeToTopic({
          peerId: alice.peerId.id,
          channel: {
            ...sailingChannel,
            // @ts-ignore - Setting channel values undefined causes payload typing mismatch
            messages: undefined,
            messagesSlice: undefined
          }
        })
      )
      .run()
  })
})
