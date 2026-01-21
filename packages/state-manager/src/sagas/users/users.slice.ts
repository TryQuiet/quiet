import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { StoreKeys } from '../store.keys'
import {
  UserProfile,
  User,
  SaveUserProfileActionPayload,
  DeleteUserProfileActionPayload,
  FileMetadata,
} from '@quiet/types'
import { createLogger } from '../../utils/logger'

const logger = createLogger('usersSlice')

export class UsersState {
  // Mapping of userId to UserProfile (for display data)
  public userProfiles: Record<string, UserProfile> = {}
  // Mapping of userId to User (for sigchain state cache)
  public users: Record<string, User> = {}
  // Error string for save user profile failures
  public saveUserProfileError: string | null = null
}

export const usersSlice = createSlice({
  initialState: { ...new UsersState() },
  name: StoreKeys.Users,
  reducers: {
    saveUserProfile: (state, _action: PayloadAction<SaveUserProfileActionPayload>) => state,
    setSaveUserProfileError: (state, action: PayloadAction<string | null>) => {
      state.saveUserProfileError = action.payload
      return state
    },
    // Bootstraps initial user profiles from the server, wipes state and sets new profiles
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
    updateUserProfiles: (state, action: PayloadAction<UserProfile[]>) => {
      if (!state.userProfiles) {
        state.userProfiles = {}
      }
      for (const userProfile of action.payload) {
        if (state.userProfiles[userProfile.userId]) {
          const existingProfile = state.userProfiles[userProfile.userId]

          const updatedProfile = {
            ...existingProfile,
            ...userProfile,
          }

          // If CID is the same, preserve the existing path
          if (
            userProfile.profilePhoto?.cid &&
            existingProfile.profilePhoto?.cid === userProfile.profilePhoto.cid &&
            existingProfile.profilePhoto?.path
          ) {
            updatedProfile.profilePhoto = {
              ...userProfile.profilePhoto,
              path: existingProfile.profilePhoto.path,
            }
          }

          // If CID changed, ensure path is null (it should be null from userProfile anyway, but let's be explicit)
          if (userProfile.profilePhoto?.cid && existingProfile.profilePhoto?.cid !== userProfile.profilePhoto.cid) {
            updatedProfile.profilePhoto = {
              ...userProfile.profilePhoto,
              path: null,
            }
          }

          state.userProfiles[userProfile.userId] = updatedProfile
        } else {
          state.userProfiles[userProfile.userId] = userProfile
        }
      }
      return state
    },
    // Sets a single user profile, overwriting the existing one
    setUserProfile: (state, action: PayloadAction<UserProfile>) => {
      // Creating user profiles object for backwards compatibility with 2.0.1
      if (!state.userProfiles) {
        state.userProfiles = {}
      }
      state.userProfiles[action.payload.userId] = action.payload
      return state
    },
    // Deletes a single user profile
    deleteUserProfile: (state, action: PayloadAction<DeleteUserProfileActionPayload>) => {
      delete state.userProfiles[action.payload.userId]
      return state
    },
    setUsers: (state, action: PayloadAction<User[]>) => {
      state.users = {}
      for (const user of action.payload) {
        state.users[user.userId] = user
      }
      return state
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.users[action.payload.userId] = action.payload
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
  },
})

export const usersActions = usersSlice.actions
export const usersReducer = usersSlice.reducer
