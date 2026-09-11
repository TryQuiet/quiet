import { createSelector } from '@reduxjs/toolkit'

import { type CreatedSelectors, type StoreState } from '../../store.types'
import { StoreKeys } from '../../store.keys'
import { Identity, UserProfile } from '@quiet/types'
import { identitySelectors } from '../../identity/identity.selectors'
import { usersSelectors } from '../users.selectors'
import { createLogger } from '../../../utils/logger'
const usersSlice: CreatedSelectors[StoreKeys.Users] = (state: StoreState) => state[StoreKeys.Users]

const logger = createLogger('UserProfilesSelectors')

// Nullish coalescing operator for backwards compatibility with 2.0.1
export const userProfiles = createSelector(usersSlice, users => {
  const profiles: { [userId: string]: UserProfile } = {}
  for (const [userId, profile] of Object.entries(users.userProfiles)) {
    const channels = users.users[userId]?.channelIds ?? []
    profiles[userId] = {
      ...profile,
      channels,
    }
  }
  return profiles
})

export const myUserProfile = createSelector(
  userProfiles,
  usersSelectors.allUsers,
  identitySelectors.currentIdentity,
  (userProfiles, users, currentIdentity) => {
    if (currentIdentity?.userId) {
      let myProfile = userProfiles[currentIdentity.userId] as UserProfile
      const myUser = users[currentIdentity.userId]
      if (myUser != null) {
        myProfile = {
          ...myProfile,
          channels: myUser.channelIds,
        }
      }
      return myProfile
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
