import { combineReducers, createStore, type Store } from '@reduxjs/toolkit'
import { StoreKeys } from '../../store.keys'

import { createUserCsr, pubKeyFromCsr } from '@quiet/identity'
import { type Identity, type UserCsr, type UserProfile } from '@quiet/types'

import { communitiesReducer, CommunitiesState } from '../../communities/communities.slice'
import { usersReducer, UsersState } from '../users.slice'
import { identityReducer, IdentityState } from '../../identity/identity.slice'
import { identityAdapter } from '../../identity/identity.adapter'
import { userProfileSelectors } from './userProfile.selectors'

describe('user profile selectors', () => {
  let csr: UserCsr
  let identity: Identity
  let pubKey: string
  let profile: UserProfile

  let store: Store

  beforeAll(async () => {
    csr = await createUserCsr({
      nickname: '',
      commonName: '',
      peerId: '',
      dmPublicKey: '',
      signAlg: '',
      hashAlg: '',
    })

    identity = {
      id: 'communityId',
      userCsr: csr,
    } as Identity

    profile = {
      profile: { photo: 'test' },
    } as UserProfile

    pubKey = pubKeyFromCsr(csr.userCsr)
  })

  beforeEach(() => {
    store = createStore(
      combineReducers({
        [StoreKeys.Communities]: communitiesReducer,
        [StoreKeys.Users]: usersReducer,
        [StoreKeys.Identity]: identityReducer,
      }),
      {
        [StoreKeys.Communities]: {
          ...new CommunitiesState(),
          currentCommunity: 'communityId',
        },
        [StoreKeys.Users]: {
          ...new UsersState(),
          userProfiles: { [pubKey]: profile },
        },
        [StoreKeys.Identity]: {
          ...new IdentityState(),
          identities: identityAdapter.setAll(identityAdapter.getInitialState(), [identity]),
        },
      }
    )
  })

  it("myUserProfile returns the current user's profile", async () => {
    const userProfile = userProfileSelectors.myUserProfile(store.getState())
    expect(userProfile).toEqual(profile)
  })
})

export {}
