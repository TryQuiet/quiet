import { setupCrypto } from '@quiet/identity'
import { Store } from '../../store.types'
import { prepareStore } from '../../../utils/tests/prepareStore'
import { getFactory, messages, PublicChannel, publicChannels } from '../../..'
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
import { messagesActions } from '../../messages/messages.slice'
import { generateChannelAddress } from '@quiet/common'

describe('channelsReplicatedSaga', () => {
  let store: Store
  let factory: FactoryGirl

  let community: Community
  let alice: Identity

  let generalChannel: PublicChannel
  let sailingChannel: PublicChannel
  let photoChannel: PublicChannel

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
          address: generateChannelAddress('sailing')
        }
      })
    ).payload.channel

    photoChannel = (
      await factory.build<typeof publicChannelsActions.addChannel>('PublicChannel', {
        communityId: community.id,
        channel: {
          name: 'photo',
          description: 'Welcome to #photo',
          timestamp: DateTime.utc().valueOf(),
          owner: 'owner',
          address: 'photo'
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

  test('Add replicated channel to local store and create corresponding messages base', async () => {
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
        messagesActions.addPublicChannelsMessagesBase({
          channelAddress: sailingChannel.address
        })
      )
      .run()
  })

  test('Do not perform adding channel and messages base actions if channel is already stored', async () => {
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
      .put(
        messagesActions.addPublicChannelsMessagesBase({
          channelAddress: sailingChannel.address
        })
      )
      .not.put(
        publicChannelsActions.addChannel({
          channel: generalChannel
        })
      )
      .not.put(
        messagesActions.addPublicChannelsMessagesBase({
          channelAddress: generalChannel.address
        })
      )
      .run()
  })

  test('populate channel cache on collecting data from persist', async () => {
    const message = await factory.create<
      ReturnType<typeof publicChannels.actions.test_message>['payload']
    >('Message', {
      identity: alice
    })

    store.dispatch(
      publicChannels.actions.cacheMessages({
        messages: [],
        channelAddress: generalChannel.address
      })
    )

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
      .put(messages.actions.resetCurrentPublicChannelCache())
      .run()
  })

  test('do not reset channel cache if already populated', async () => {
    const message = await factory.create<
      ReturnType<typeof publicChannels.actions.test_message>['payload']
    >('Message', {
      identity: alice
    })

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
      .not.put(messages.actions.resetCurrentPublicChannelCache())
      .run()
  })

  test('remove channel from store if it doesnt exist in the payload from the backend', async () => {
    store.dispatch(publicChannelsActions.addChannel({ channel: photoChannel }))

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
      .put(publicChannelsActions.deleteChannel({ channelAddress: photoChannel.address }))
      .run()
  })
})
