import { createSelector } from '@reduxjs/toolkit'

import { type CreatedSelectors, type StoreState } from '../../store.types'
import { StoreKeys } from '../../store.keys'
import { currentPubKey } from '../../identity/identity.selectors'

const usersSlice: CreatedSelectors[StoreKeys.Users] = (state: StoreState) => state[StoreKeys.Users]

// Nullish coalescing operator for backwards compatibility with 2.0.1
export const userProfiles = createSelector(usersSlice, users => users.userProfiles ?? {})

export const myUserProfile = createSelector(userProfiles, currentPubKey, (userProfiles, pubKey) => {
  if (pubKey) {
    return userProfiles[pubKey]
  }
  return undefined
})

export const userProfileSelectors = {
  userProfiles,
  myUserProfile,
}
