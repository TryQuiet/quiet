import { createSelector } from '@reduxjs/toolkit'
import { StoreKeys } from '../store.keys'
import { type CreatedSelectors, type StoreState } from '../store.types'
import { type UserData, User } from '@quiet/types'
import { createLogger } from '../../utils/logger'

const logger = createLogger('usersSelectors')

const usersSlice: CreatedSelectors[StoreKeys.Users] = (state: StoreState) => state[StoreKeys.Users]

export const users = createSelector(usersSlice, reducerState => {
  return reducerState.users
})

export const allUsers = createSelector(users, users => {
  // TODO: just return users
  const regUsers: Record<string, User> = {}
  for (const [userId, user] of Object.entries(users)) {
    regUsers[userId] = user
  }
  return regUsers
})

export const getUserById = (userId: string) =>
  createSelector(users, users => {
    if (userId in users) {
      return users[userId]
    }
    logger.warn(`User ${userId} not found`)
    return null
  })

export const usersSelectors = {
  allUsers,
  getUserById,
}
