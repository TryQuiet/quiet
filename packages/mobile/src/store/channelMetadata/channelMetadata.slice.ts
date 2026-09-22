import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { StoreKeys } from '../store.keys'
import { type MobileChannelMetadataUpdatedPayload } from '@quiet/types'
import { createLogger } from '../../utils/logger'

const logger = createLogger('channelMetadataSlice')

export class ChannelMetadataState {}

export const channelMetadataSlice = createSlice({
  initialState: { ...new ChannelMetadataState() },
  name: StoreKeys.ChannelMetadata,
  reducers: {
    saveChannelMetadataInKeychain: (state, _action: PayloadAction<MobileChannelMetadataUpdatedPayload>) => state,
  },
})

export const channelMetadataActions = channelMetadataSlice.actions
export const channelMetadataReducer = channelMetadataSlice.reducer
