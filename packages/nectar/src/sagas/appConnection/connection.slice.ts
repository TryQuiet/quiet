import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { StoreKeys } from '../store.keys';
import { CommunityId, RegistrarId } from './connection.types';

export class ConnectionState {
  public initializedCommunities: CommunityId[] = [];

  public initializedRegistrars: RegistrarId[] = [];
}

export const connectionSlice = createSlice({
  initialState: { ...new ConnectionState() },
  name: StoreKeys.Connection,
  reducers: {
    addInitializedCommunity: (state, action: PayloadAction<CommunityId>) => {
      state.initializedCommunities = [
        ...state.initializedCommunities,
        action.payload,
      ];
    },
    addInitializedRegistrar: (state, action: PayloadAction<RegistrarId>) => {
      state.initializedRegistrars = [
        ...state.initializedRegistrars,
        action.payload,
      ];
    },
  },
});

export const connectionActions = connectionSlice.actions;
export const connectionReducer = connectionSlice.reducer;
