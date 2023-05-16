import { setupCrypto } from '@quiet/identity'
import { Store } from '../../store.types'
import { prepareStore } from '../../../utils/tests/prepareStore'
import { getFactory } from '../../..'
import { FactoryGirl } from 'factory-girl'
import { combineReducers } from 'redux'
import { reducers } from '../../reducers'
import { expectSaga } from 'redux-saga-test-plan'
import { call } from 'redux-saga-test-plan/matchers'
import { publicChannelsActions } from './../publicChannels.slice'
import { identityActions } from '../../identity/identity.slice'
import { createGeneralChannelSaga, getChannelTimestamp } from './createGeneralChannel.saga'
import { communitiesActions } from '../../communities/communities.slice'
import { Community, Identity } from '@quiet/types'

describe('createGeneralChannelSaga', () => {
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
  })

  test('create general channel', async () => {
    const reducer = combineReducers(reducers)
    await expectSaga(createGeneralChannelSaga)
      .withReducer(reducer)
      .withState(store.getState())
      .provide([
        [call.fn(getChannelTimestamp), 0]
      ])
      .put(
        publicChannelsActions.createChannel({
          channel: {
            name: 'general',
            description: 'Welcome to #general',
            owner: alice.nickname,
            address: 'general',
            timestamp: 0
          }
        })
      )
      .put(
        publicChannelsActions.setCurrentChannel({
          channelAddress: 'general'
        })
      )
      .run()
  })
})
