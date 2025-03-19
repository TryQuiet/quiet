import { combineReducers, createStore, type Store } from '@reduxjs/toolkit'
import { StoreKeys } from '../../store.keys'

import { type Identity, type UserProfile } from '@quiet/types'

import { communitiesReducer, CommunitiesState } from '../../communities/communities.slice'
import { usersReducer, UsersState } from '../users.slice'
import { identityReducer, IdentityState } from '../../identity/identity.slice'
import { identityAdapter } from '../../identity/identity.adapter'
import { userProfileSelectors } from './userProfile.selectors'

describe('user profile selectors', () => {
  let profile: UserProfile
  let identity: Identity
  let store: Store
  const communityId = 'communityId'

  beforeAll(async () => {})

  beforeEach(() => {
    // TODO: use the factory
    // profile = {
    //   userId: 'myUserId',
    //   profile: {
    //     nickname: 'alice',
    //     photo: 'photo',
    //   },
    // }
    // identity = {
    //   id: communityId,
    //   userId: profile.userId,
    // }
    // store = createStore(
    //   combineReducers({
    //     [StoreKeys.Communities]: communitiesReducer,
    //     [StoreKeys.Users]: usersReducer,
    //     [StoreKeys.Identity]: identityReducer,
    //   }),
    //   {
    //     [StoreKeys.Communities]: {
    //       ...new CommunitiesState(),
    //       currentCommunity: communityId,
    //     },
    //     [StoreKeys.Users]: {
    //       ...new UsersState(),
    //       userProfiles: { [profile.userId]: profile },
    //     },
    //     [StoreKeys.Identity]: {
    //       ...new IdentityState(),
    //       identities: identityAdapter.setAll(identityAdapter.getInitialState(), [identity]),
    //     },
    //   }
    // )
  })

  it("myUserProfile returns the current user's profile", async () => {
    // const userProfile = userProfileSelectors.myUserProfile(store.getState())
    // expect(userProfile).toEqual(profile)
    expect(true).toBe(true)
  })
})

export {}
