import { createSlice, EntityState, PayloadAction } from '@reduxjs/toolkit';
import { StoreKeys } from '../store.keys';
import { communitiesAdapter } from './communities.adapter';
import { createRootCA } from '@zbayapp/identity';

export class CommunitiesState {
  public currentCommunity: string = ''
  public communities: EntityState<Community> =
    communitiesAdapter.getInitialState();
}


export class Community {
  constructor({ id, CA, name, registrarUrl }) {
    this.id = id;
    if (CA) {
      this.CA = CA;
    }
    if (name) {
      this.name = name;
    }
    if (registrarUrl) {
      this.onionAddress = registrarUrl;
    }
  }
  public name: string = '';
  id: string = '';
  CA: null | {} = null;
  public registrar: {
    privateKey: string
    address: string
  }
  privateKey: string = '';
  onionAddress: string = '';
}

export const communitiesSlice = createSlice({
  initialState: {...new CommunitiesState()},
  name: StoreKeys.Communities,
  reducers: {
    setCurrentCommunity: (state, action: any) => {
      state.currentCommunity = action.payload
    },
    addNewCommunity: (state, action: any) => {
      communitiesAdapter.addOne(state.communities, new Community(action.payload));
    },
    updateCommunity: (state, action: any) => {
      communitiesAdapter.updateOne(state.communities, {
        id: action.payload.id,
        changes: {
          ...action.payload,
        },
      });
    },
    joinCommunity: (state, action: any) => {
      communitiesAdapter.addOne(state.communities, new Community(action.payload));
    },
    createNewCommunity: (state, _action: PayloadAction<string>) => state,
    responseCreateCommunity: (
      state,
      _action: PayloadAction<any>
    ) => state,
    responseRegistrar: (state, action: PayloadAction<any>) => {
      communitiesAdapter.updateOne(state.communities, {
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
