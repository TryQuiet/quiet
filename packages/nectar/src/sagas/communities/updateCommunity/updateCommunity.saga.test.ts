import { combineReducers } from '@reduxjs/toolkit'
import { expectSaga } from 'redux-saga-test-plan'
import { setupCrypto } from '@quiet/identity'
import { prepareStore } from '../../../utils/tests/prepareStore'
import { getFactory } from '../../../utils/tests/factories'
import { communitiesActions, Community } from '../communities.slice'
import { updateCommunitySaga } from './updateCommunity.saga'
import { reducers } from '../../reducers'

describe('updateCommunitySaga', () => {
  test('update community', async () => {
    setupCrypto()

    const store = prepareStore().store

    const factory = await getFactory(store)

    const community: Community = await factory.create<
    ReturnType<typeof communitiesActions.addNewCommunity>['payload']
    >('Community')

    const rootCa =
      'MIIBaDCCAQ6gAwIBAgIBATAKBggqhkjOPQQDAjAZMRcwFQYDVgUGEw5xdWlldGNvbW11bml0eTAmGBMyMDIyMDQyMTEyNTQxMi41MjJaGA8yMDMwMDEzMTIzMDAwMFowGTEXMBUGA1YFBhMOcXVpZXRjb21tdW5pdHkwWTATBgcqhkjOPQIBBggqhkjOPQMBBwNCAAQ7avAf//cTpBKI2Lpab0eFoe0sa5aK2hGGpKflJXWFQTyVEE7SRpsmR4lgKmN6clP/6dertD0vc67OktnHfblzoz8wPTAPBgNVHRMECDAGAQH/AgEDMAsGA1UdDwQEAwIAhjAdBgNVHSUEFjAUBggrBgEFBQcDAgYIKwYBBQUHAwEwCgYIKoZIzj0EAwIDSAAwRQIgWUIr/SBWxgszrBkLlhGBrEsmPjmM9WOw7/xo4U7i13QCIQCjfMWOF+gOQ7okF7GMnneLa5VLnju1k05/RfzWsQ5liQ=='

    const reducer = combineReducers(reducers)
    await expectSaga(
      updateCommunitySaga,
      communitiesActions.updateCommunity({
        id: community.id,
        rootCa: rootCa
      })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .put(
        communitiesActions.updateCommunityData({
          id: community.id,
          rootCa: rootCa,
          name: 'quietcommunity'
        })
      )
      .run()
  })
})
