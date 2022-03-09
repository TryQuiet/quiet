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
      'MIIBTTCB8wIBATAKBggqhkjOPQQDAjASMRAwDgYDVQQDEwdaYmF5IENBMB4XDTEwMTIyODEwMTAxMFoXDTMwMTIyODEwMTAxMFowEjEQMA4GA1UEAxMHWmJheSBDQTBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABBXmkE9W4NHQWUgmaH6j7TLSzOgyNIr8VshAeAMAg36IGvhtxhXNMUMYUApE7K9cifbxn6RVkSird97B7IFMefKjPzA9MA8GA1UdEwQIMAYBAf8CAQMwCwYDVR0PBAQDAgCGMB0GA1UdJQQWMBQGCCsGAQUFBwMCBggrBgEFBQcDATAKBggqhkjOPQQDAgNJADBGAiEAgY783/mGO15DK319VK/2wiAvq10oce4YdWdx2XUrKFoCIQDOh7r8ZlyLoNAT6FiNM/oBCaR3FrKmg7Nz4+ZbtvZMiw=='

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
          name: 'Zbay CA'
        })
      )
      .run()
  })
})
