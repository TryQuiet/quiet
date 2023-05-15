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
import { Identity } from '../../identity/identity.types'
import { identityActions } from '../../identity/identity.slice'
import { createGeneralChannelSaga, getChannelTimestamp } from './createGeneralChannel.saga'
import { communitiesActions, Community } from '../../communities/communities.slice'
import { generateChannelAddress } from '@quiet/common'

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
    const generalAddress = generateChannelAddress('general')
    const channel = {
      name: 'general',
      description: 'Welcome to #general',
      owner: alice.nickname,
      address: generalAddress,
      timestamp: 0
    }
    console.log({ channel })
    await expectSaga(createGeneralChannelSaga)
      .withReducer(reducer)
      .withState(store.getState())
      .provide([[call.fn(getChannelTimestamp), 0]])
      .provide([[call.fn(generateChannelAddress), generalAddress]])
      .put(
        publicChannelsActions.createChannel({
          channel
        })
      )
      .put(
        publicChannelsActions.setCurrentChannel({
          channelAddress: generalAddress
        })
      )
      .run()
  })
})
