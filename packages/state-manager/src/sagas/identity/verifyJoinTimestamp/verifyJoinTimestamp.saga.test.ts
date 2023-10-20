import { combineReducers } from '@reduxjs/toolkit'
import { expectSaga } from 'redux-saga-test-plan'
import { type Socket } from '../../../types'
import { type communitiesActions } from '../../communities/communities.slice'
import { type Store } from '../../store.types'
import { type FactoryGirl } from 'factory-girl'
import { setupCrypto } from '@quiet/identity'
import { prepareStore, reducers } from '../../../utils/tests/prepareStore'
import { getFactory } from '../../../utils/tests/factories'
import { verifyJoinTimestampSaga } from './verifyJoinTimestamp.saga'
import { identityActions } from '../identity.slice'

describe('verifyJoinTimestampSaga', () => {
  let store: Store
  let factory: FactoryGirl

  beforeEach(async () => {
    setupCrypto()
    store = prepareStore().store
    factory = await getFactory(store)
  })

  it('user has valid timestamp', async () => {
    const community = await factory.create<ReturnType<typeof communitiesActions.addNewCommunity>['payload']>(
      'Community'
    )

    await factory.create<ReturnType<typeof identityActions.addNewIdentity>['payload']>('Identity', {
      id: community.id,
      nickname: 'john',
    })

    const reducer = combineReducers(reducers)
    await expectSaga(verifyJoinTimestampSaga).withReducer(reducer).withState(store.getState()).run()
  })

  it('user doesnt have timestamp', async () => {
    const community = await factory.create<ReturnType<typeof communitiesActions.addNewCommunity>['payload']>(
      'Community'
    )

    await factory.create<ReturnType<typeof identityActions.addNewIdentity>['payload']>('Identity', {
      id: community.id,
      nickname: 'john',
      joinTimestamp: null,
    })

    const reducer = combineReducers(reducers)
    await expectSaga(verifyJoinTimestampSaga)
      .withReducer(reducer)
      .withState(store.getState())
      .put(identityActions.updateJoinTimestamp({ communityId: community.id }))
      .run()
  })
})
