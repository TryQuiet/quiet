import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { StoreKeys } from '../store.keys'
import { UserProfile, User } from '@quiet/types'

export class UsersState {
  // Mapping of userId to UserProfile
  public userProfiles: Record<string, UserProfile> = {}
  public users: Record<string, User> = {}
  // TODO: replace localUserContext with object with keys stripped
  public myUserId: string | null = null
}

export const usersSlice = createSlice({
  initialState: { ...new UsersState() },
  name: StoreKeys.Users,
  reducers: {
    // Utility action for testing purposes
    saveUserProfile: (state, _action: PayloadAction<{ photo?: File }>) => state,
    setUserProfiles: (state, action: PayloadAction<UserProfile[]>) => {
      // Creating user profiles object for backwards compatibility with 2.0.1
      if (!state.userProfiles) {
        state.userProfiles = {}
      }
      for (const userProfile of action.payload) {
        state.userProfiles[userProfile.userId] = userProfile
      }
      return state
    },
    deleteUserProfile: (state, action: PayloadAction<string>) => {
      delete state.userProfiles[action.payload]
      return state
    },
    setUsers: (state, action: PayloadAction<User[]>) => {
      state.users = {}
      for (const user of action.payload) {
        state.users[user.userId] = user
      }
      return state
    },
    deleteUsers: (state, action: PayloadAction<User[]>) => {
      for (const user of action.payload) {
        try {
          delete state.users[user.userId]
        } catch (e) {
          // User not found
        }
      }
      return state
    },
    clearUsers: state => {
      state.users = {}
      return state
    },
    setMyUserId: (state, action: PayloadAction<string>) => {
      state.myUserId = action.payload
      return state
    },
  },
})

export const usersActions = usersSlice.actions
export const usersReducer = usersSlice.reducer
