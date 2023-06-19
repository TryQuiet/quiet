import { combineReducers } from '@reduxjs/toolkit'
import { expectSaga } from 'redux-saga-test-plan'
import { setupCrypto } from '@quiet/identity'
import { prepareStore } from '../../../utils/tests/prepareStore'
import { getFactory } from '../../../utils/tests/factories'
import { communitiesActions } from '../communities.slice'
import { updateCommunitySaga } from './updateCommunity.saga'
import { reducers } from '../../reducers'
import { type Community } from '@quiet/types'

describe('updateCommunitySaga', () => {
  test('update community', async () => {
    setupCrypto()

    const store = prepareStore().store

    const factory = await getFactory(store)

    const community: Community = await factory.create<ReturnType<typeof communitiesActions.addNewCommunity>['payload']>(
      'Community'
    )

    const rootCa =
      'MIIBYDCCAQagAwIBAgIBATAKBggqhkjOPQQDAjAZMRcwFQYDVQQDEw5xdWlldGNvbW11bml0eTAeFw0xMDEyMjgxMDEwMTBaFw0zMDEyMjgxMDEwMTBaMBkxFzAVBgNVBAMTDnF1aWV0Y29tbXVuaXR5MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEQhderWYwXEfJ/SY7BLkPlgrqj6I1nwICH7TUCCZ+YD2j2m7WqJ2HfWMxjF//hInzIcSwZLJEDPCJroS13tn37KM/MD0wDwYDVR0TBAgwBgEB/wIBAzALBgNVHQ8EBAMCAIYwHQYDVR0lBBYwFAYIKwYBBQUHAwIGCCsGAQUFBwMBMAoGCCqGSM49BAMCA0gAMEUCIGZqjtn6WU65HtCjIi6sWnwsre1HdGfBQYV1z8tCSsVpAiEAjQ04iRlFT7UZOxn5Y9j1jLHtp/KvhcW7g5vgbnY0EIQ='

    const reducer = combineReducers(reducers)
    await expectSaga(
      updateCommunitySaga,
      communitiesActions.updateCommunity({
        id: community.id,
        rootCa,
      })
    )
      .withReducer(reducer)
      .withState(store.getState())
      .put(
        communitiesActions.updateCommunityData({
          id: community.id,
          rootCa,
          name: 'quietcommunity',
        })
      )
      .run()
  })
})
