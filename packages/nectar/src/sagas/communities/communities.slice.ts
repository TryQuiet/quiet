import { createSlice, EntityState, PayloadAction } from '@reduxjs/toolkit';
import { StoreKeys } from '../store.keys';
import { communitiesAdapter } from './communities.adapter';

export class CommunitiesState {
  public identities: EntityState<Community> = communitiesAdapter.getInitialState();
}

export class Community {
  constructor({ id, CA, name, registrarUrl }) {
    this.id = id;
    this.CA = CA;
    this.name = name;
    this.onionAddress = registrarUrl;
  }

  image: string = '';
  name: string = '';
  id: string = '';
  memberType: string = '';
  CA: null | {} = null;
  privateKey: string = '';
  onionAddress: string = '';
  peerId: string = '';
}

export const communitiesSlice = createSlice({
  initialState: communitiesAdapter.getInitialState(),
  name: StoreKeys.Communities,
  reducers: {
    addNewCommunity: (state, action: any) => {
      communitiesAdapter.addOne(state, new Community(action.payload));
    },
    updateCommunity: (state, action: any) => {
      communitiesAdapter.updateOne(state, {
        id: action.payload.id,
        changes: {
          ...action.payload,
        },
      });
    },
    joinCommunity: (state, _action: PayloadAction<string>) => state,
    createNewCommunity: (state, _action: PayloadAction<string>) => state,
    responseCreateCommunity: (
      state,
      _action: PayloadAction<{ id: string; network: string }>
    ) => state,
    responseRegistrar: (state, action: PayloadAction<any>) => {
      communitiesAdapter.updateOne(state, {
        id: action.payload.id,
        changes: {
          ...action.payload.payload,
        },
      });
    },
  },
});

export const communitiesActions = communitiesSlice.actions;
export const communitiesReducer = communitiesSlice.reducer;
