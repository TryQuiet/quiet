import { createSelector } from '@reduxjs/toolkit'

import { type CreatedSelectors, type StoreState } from '../../store.types'
import { StoreKeys } from '../../store.keys'
import { Identity, UserProfile } from '@quiet/types'
import { identitySelectors } from '../../identity/identity.selectors'
const usersSlice: CreatedSelectors[StoreKeys.Users] = (state: StoreState) => state[StoreKeys.Users]

// Nullish coalescing operator for backwards compatibility with 2.0.1
export const userProfiles = createSelector(usersSlice, users => users.userProfiles ?? {})

export const myUserProfile = createSelector(
  userProfiles,
  identitySelectors.currentIdentity,
  (userProfiles, currentIdentity) => {
    if (currentIdentity?.userId) {
      return userProfiles[currentIdentity.userId] as UserProfile
    }
    return undefined
  }
)

export const getUserProfileById = (userId: string) =>
  createSelector(userProfiles, userProfiles => {
    if (userId in userProfiles) {
      return userProfiles[userId] as UserProfile
    }
    return null
  })

export const userProfileSelectors = {
  userProfiles,
  myUserProfile,
  getUserProfileById,
}
