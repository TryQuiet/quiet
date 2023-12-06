import { setupCrypto } from '@quiet/identity'
import { type Store } from '../../store.types'
import { prepareStore } from '../../../utils/tests/prepareStore'
import { getFactory } from '../../..'
import { type FactoryGirl } from 'factory-girl'
import { combineReducers } from 'redux'
import { reducers } from '../../reducers'
import { expectSaga } from 'redux-saga-test-plan'
import { call } from 'redux-saga-test-plan/matchers'
import { publicChannelsActions } from './../publicChannels.slice'
import { type identityActions } from '../../identity/identity.slice'
import { createGeneralChannelSaga, getChannelTimestamp } from './createGeneralChannel.saga'
import { generateChannelId } from '@quiet/common'
import { type communitiesActions } from '../../communities/communities.slice'
import { type Community, type Identity } from '@quiet/types'

describe('createGeneralChannelSaga', () => {
  let store: Store
  let factory: FactoryGirl

  let community: Community
  let alice: Identity

  beforeAll(async () => {
    setupCrypto()

    store = prepareStore().store
    factory = await getFactory(store)

    community = await factory.create<ReturnType<typeof communitiesActions.storeCommunity>['payload']>('Community')

    alice = await factory.create<ReturnType<typeof identityActions.storeIdentity>['payload']>('Identity', {
      id: community.id,
      nickname: 'alice',
    })
  })

  test('create general channel', async () => {
    const reducer = combineReducers(reducers)
    const generalId = generateChannelId('general')
    const channel = {
      name: 'general',
      description: 'Welcome to #general',
      owner: alice.nickname,
      id: generalId,
      timestamp: 0,
    }
    console.log({ channel })
    await expectSaga(createGeneralChannelSaga)
      .withReducer(reducer)
      .withState(store.getState())
      .provide([
        [call.fn(getChannelTimestamp), 0],
        [call.fn(generateChannelId), generalId],
      ])
      .put(
        publicChannelsActions.createChannel({
          channel,
        })
      )
      .put(
        publicChannelsActions.setCurrentChannel({
          channelId: generalId,
        })
      )
      .run()
  })
})
