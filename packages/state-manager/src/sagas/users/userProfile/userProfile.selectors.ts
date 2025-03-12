import { createSelector } from '@reduxjs/toolkit'

import { type CreatedSelectors, type StoreState } from '../../store.types'
import { StoreKeys } from '../../store.keys'
import { Identity, UserProfile } from '@quiet/types'
const usersSlice: CreatedSelectors[StoreKeys.Users] = (state: StoreState) => state[StoreKeys.Users]

// Nullish coalescing operator for backwards compatibility with 2.0.1
export const userProfiles = createSelector(usersSlice, users => users.userProfiles ?? {})

export const myUserId = createSelector(usersSlice, users => users.myUserId)

export const myUserProfile = createSelector(userProfiles, myUserId, (userProfiles, myUserId) => {
  if (myUserId) {
    return userProfiles[myUserId] as UserProfile
  }
  return undefined
})

export const userProfileSelectors = {
  userProfiles,
  myUserProfile,
  myUserId,
}
