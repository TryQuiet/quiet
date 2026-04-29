import { setupCrypto } from '@quiet/identity'
import { type Store } from '../../store.types'
import { prepareStore, testReducers } from '../../../utils/tests/prepareStore'
import { type FactoryGirl } from 'factory-girl'
import { combineReducers } from 'redux'
import { expectSaga } from 'redux-saga-test-plan'
import { call } from 'redux-saga-test-plan/matchers'
import { publicChannelsActions } from './../publicChannels.slice'
import { createGeneralChannelSaga } from './createGeneralChannel.saga'
import { generateChannelId } from '@quiet/common'
import { type communitiesActions } from '../../communities/communities.slice'
import { ChannelType, type Community, type Identity } from '@quiet/types'
import { createLogger } from '../../../utils/logger'
import { getReduxStoreFactory } from '../../../utils/tests/factories'

const logger = createLogger('createGeneralChannelSage-test')

describe('createGeneralChannelSaga', () => {
  let store: Store
  let factory: FactoryGirl

  let community: Community
  let alice: Identity

  beforeAll(async () => {
    setupCrypto()

    store = prepareStore().store
    factory = await getReduxStoreFactory(store)

    community = await factory.create('Community')

    alice = await factory.create('Identity', {
      communityId: community.id,
      nickname: 'alice',
    })
  })

  test('create general channel', async () => {
    const generalId = generateChannelId('general')
    const channel: ReturnType<typeof publicChannelsActions.createChannel>['payload'] = {
      name: 'general',
      description: 'Welcome to #general',
      id: generalId,
      type: ChannelType.CHANNEL,
    }
    await expectSaga(createGeneralChannelSaga)
      .withReducer(combineReducers(testReducers))
      .withState(store.getState())
      .provide([[call.fn(generateChannelId), generalId]])
      .put(publicChannelsActions.createChannel(channel))
      .put(
        publicChannelsActions.setCurrentChannel({
          channelId: generalId,
        })
      )
      .run()
  })
})
