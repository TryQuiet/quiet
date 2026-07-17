import { setupCrypto } from '@quiet/identity'
import { type Store } from '../store.types'
import { prepareStore, testReducers } from '../../utils/tests/prepareStore'
import { type FactoryGirl } from 'factory-girl'
import { combineReducers } from 'redux'
import { expectSaga } from 'redux-saga-test-plan'
import { publicChannelsActions } from './publicChannels.slice'
import { type Community, type Identity } from '@quiet/types'
import { createLogger } from '../../utils/logger'
import { getReduxStoreFactory } from '../../utils/tests/factories'
import { waitForChannelSubscriptionSaga } from './waitForChannelSubscription.saga'
import { publicChannelsSelectors } from './publicChannels.selectors'

const logger = createLogger('waitForChannelSubscriptionSaga:test')

describe('waitForChannelSubscriptionSaga', () => {
  let store: Store
  let factory: FactoryGirl

  let community: Community
  let alice: Identity

  beforeAll(async () => {
    setupCrypto()
  })

  beforeEach(async () => {
    store = prepareStore().store
    factory = await getReduxStoreFactory(store)

    community = await factory.create('Community')

    alice = await factory.create('Identity', {
      communityId: community.id,
      nickname: 'alice',
    })
  })

  test('wait for channel subscription - already subscribed', async () => {
    const localGeneralChannel = publicChannelsSelectors.generalChannel(store.getState())
    expect(localGeneralChannel).toBeDefined()
    const channelId = localGeneralChannel!.id
    await expectSaga(waitForChannelSubscriptionSaga, channelId)
      .withReducer(combineReducers(testReducers))
      .withState(store.getState())
      .not.take(publicChannelsActions.setChannelSubscribed)
      .run()
  })

  test('wait for channel subscription - not initially subscribed', async () => {
    const channelId = 'foobar'
    await expectSaga(waitForChannelSubscriptionSaga, channelId)
      .withReducer(combineReducers(testReducers))
      .withState(store.getState())
      .take(publicChannelsActions.setChannelSubscribed)
      .dispatch(publicChannelsActions.setChannelSubscribed({ channelId: channelId }))
      .not.take(publicChannelsActions.setChannelSubscribed)
      .run()
  })

  test('wait for channel subscription - ignores setChannelSubscribed for other channel', async () => {
    const channelId = 'foobar'
    await expectSaga(waitForChannelSubscriptionSaga, channelId)
      .withReducer(combineReducers(testReducers))
      .withState(store.getState())
      .take(publicChannelsActions.setChannelSubscribed)
      .dispatch(publicChannelsActions.setChannelSubscribed({ channelId: 'abc123' }))
      .take(publicChannelsActions.setChannelSubscribed)
      .dispatch(publicChannelsActions.setChannelSubscribed({ channelId: channelId }))
      .not.take(publicChannelsActions.setChannelSubscribed)
      .run()
  })
})
