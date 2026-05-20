import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { StoreKeys } from '../store.keys'
import { UserProfilesUpdatedPayload } from '@quiet/types'
import { createLogger } from '../../utils/logger'

const logger = createLogger('keysSlice')

export class UsersMetadataState {}

export const usersMetadataSlice = createSlice({
  initialState: { ...new UsersMetadataState() },
  name: StoreKeys.Keys,
  reducers: {
    saveUserMetadataNatively: (state, _action: PayloadAction<UserProfilesUpdatedPayload>) => state,
  },
})

export const usersMetadataActions = usersMetadataSlice.actions
export const usersMetadataReducer = usersMetadataSlice.reducer
