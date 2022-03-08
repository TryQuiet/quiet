import { combineReducers } from '@reduxjs/toolkit'
import { expectSaga } from 'redux-saga-test-plan'
import { setupCrypto } from '@quiet/identity'
import { StoreKeys } from '../../store.keys'
import { prepareStore } from '../../../utils/tests/prepareStore'
import { getFactory } from '../../../utils/tests/factories'
import {
  communitiesActions,
  communitiesReducer,
  Community,
  CommunitiesState
} from '../communities.slice'
import { updateCommunitySaga } from './updateCommunity.saga'
import { reducers } from '../../reducers'
import { communitiesAdapter } from '../communities.adapter'

describe('updateCommunitySaga', () => {
  test('update community', async () => {
    setupCrypto()

    const store = prepareStore().store

    const factory = await getFactory(store)

    const community: Community = await factory.create<
      ReturnType<typeof communitiesActions.addNewCommunity>['payload']
    >('Community')

    const reducer = combineReducers(reducers)
    await expectSaga(
      updateCommunitySaga,
      communitiesActions.updateCommunity({
        id: community.id,
        rootCa: 'rootCa'
      })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .hasFinalState({
        [StoreKeys.Communities]: {
          ...new CommunitiesState(),
          currentCommunity: '1',
          communities: communitiesAdapter.setAll(communitiesAdapter.getInitialState(), [
            {
              ...community,
              rootCa: 'rootCa'
            }
          ])
        }
      })
      .run()
  })
})
