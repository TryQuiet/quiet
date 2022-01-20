import { combineReducers } from '@reduxjs/toolkit'
import { expectSaga } from 'redux-saga-test-plan'
import { setupCrypto } from '@zbayapp/identity'
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

describe('updateCommunitySaga', () => {
  test('update community', async () => {
    setupCrypto()

    const store = prepareStore().store

    const factory = await getFactory(store)

    const community: Community = await factory.create<
    ReturnType<typeof communitiesActions.addNewCommunity>['payload']
    >('Community')

    await expectSaga(
      updateCommunitySaga,
      communitiesActions.updateCommunity({
        id: 1,
        rootCa:
          'MIIBTTCB8wIBATAKBggqhkjOPQQDAjASMRAwDgYDVQQDEwdaYmF5IENBMB4XDTEwMTIyODEwMTAxMFoXDTMwMTIyODEwMTAxMFowEjEQMA4GA1UEAxMHWmJheSBDQTBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABBXmkE9W4NHQWUgmaH6j7TLSzOgyNIr8VshAeAMAg36IGvhtxhXNMUMYUApE7K9cifbxn6RVkSird97B7IFMefKjPzA9MA8GA1UdEwQIMAYBAf8CAQMwCwYDVR0PBAQDAgCGMB0GA1UdJQQWMBQGCCsGAQUFBwMCBggrBgEFBQcDATAKBggqhkjOPQQDAgNJADBGAiEAgY783/mGO15DK319VK/2wiAvq10oce4YdWdx2XUrKFoCIQDOh7r8ZlyLoNAT6FiNM/oBCaR3FrKmg7Nz4+ZbtvZMiw=='
      })
    )
      .withReducer(combineReducers({ [StoreKeys.Communities]: communitiesReducer }), {
        [StoreKeys.Communities]: {
          ...new CommunitiesState(),
          currentCommunity: '1',
          communities: {
            ids: ['1'],
            entities: {
              1: community
            }
          }
        }
      })
      .hasFinalState({
        [StoreKeys.Communities]: {
          ...new CommunitiesState(),
          currentCommunity: '1',
          communities: {
            ids: ['1'],
            entities: {
              1: {
                ...community,
                name: 'Zbay CA',
                rootCa:
                  'MIIBTTCB8wIBATAKBggqhkjOPQQDAjASMRAwDgYDVQQDEwdaYmF5IENBMB4XDTEwMTIyODEwMTAxMFoXDTMwMTIyODEwMTAxMFowEjEQMA4GA1UEAxMHWmJheSBDQTBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IABBXmkE9W4NHQWUgmaH6j7TLSzOgyNIr8VshAeAMAg36IGvhtxhXNMUMYUApE7K9cifbxn6RVkSird97B7IFMefKjPzA9MA8GA1UdEwQIMAYBAf8CAQMwCwYDVR0PBAQDAgCGMB0GA1UdJQQWMBQGCCsGAQUFBwMCBggrBgEFBQcDATAKBggqhkjOPQQDAgNJADBGAiEAgY783/mGO15DK319VK/2wiAvq10oce4YdWdx2XUrKFoCIQDOh7r8ZlyLoNAT6FiNM/oBCaR3FrKmg7Nz4+ZbtvZMiw=='
              }
            }
          }
        }
      })
      .run()
  })
})
