import { createSlice, EntityState, PayloadAction } from '@reduxjs/toolkit';
import { StoreKeys } from '../store.keys';
import { communitiesAdapter } from './communities.adapter';
import { createRootCA } from '@zbayapp/identity';
import { AsyncReturnType } from '../../utils/types/AsyncReturnType.interface';
import { Identity } from '../identity/identity.slice';

export class CommunitiesState {
  public currentCommunity: string = '';

  public communities: EntityState<Community> =
    communitiesAdapter.getInitialState();
}

export interface Community {
  id: string;
  name: string;
  CA: null | {
    rootCertString: string;
    rootKeyString: string;
  };
  rootCa: string;
  peerList: string[];
  registrarUrl: string;
  registrar: null | {
    privateKey: string;
    address: string;
  };
  onionAddress: string;
  privateKey: string;
  port: number;
}

export interface AddNewCommunityPayload {
  id: string;
  name: string;
  CA: AsyncReturnType<typeof createRootCA> | {};
  registrarUrl: string;
}

export interface ResponseRegistrarPayload {
  id: string;
  payload: Partial<Community>;
}

export interface StorePeerListPayload {
  communityId: string;
  peerList: string[];
}

export interface ResponseCreateCommunityPayload {
  id: string;
  payload: Partial<Identity>;
}

export interface ResponseLaunchCommunityPayload {
  id: string;
}

export const communitiesSlice = createSlice({
  initialState: { ...new CommunitiesState() },
  name: StoreKeys.Communities,
  reducers: {
    setCurrentCommunity: (state, action: PayloadAction<string>) => {
      state.currentCommunity = action.payload;
    },
    addNewCommunity: (state, action: PayloadAction<Community>) => {
      communitiesAdapter.addOne(state.communities, action.payload);
    },
    updateCommunity: (state, action: PayloadAction<Partial<Community>>) => {
      communitiesAdapter.updateOne(state.communities, {
        id: action.payload.id,
        changes: {
          ...action.payload,
        },
      });
    },
    joinCommunity: (state, _action: PayloadAction<string>) => state,
    community: (state, _action: PayloadAction<string>) => state,
    createNetwork: (state, _action: PayloadAction<string>) => state,
    createNewCommunity: (state, _action: PayloadAction<string>) => state,
    responseCreateCommunity: (
      state,
      _action: PayloadAction<ResponseCreateCommunityPayload>
    ) => state,
    responseRegistrar: (
      state,
      action: PayloadAction<ResponseRegistrarPayload>
    ) => {
      communitiesAdapter.updateOne(state.communities, {
        id: action.payload.id,
        changes: {
          ...action.payload.payload,
        },
      });
    },
    storePeerList: (state, action: PayloadAction<StorePeerListPayload>) => {
      communitiesAdapter.updateOne(state.communities, {
        id: action.payload.communityId,
        changes: {
          ...action.payload,
        },
      });
    },
    launchCommunity: (state, _action: PayloadAction<string>) => state,
    launchRegistrar: (state, _action: PayloadAction<string>) => state,
  },
});

export const communitiesActions = communitiesSlice.actions;
export const communitiesReducer = communitiesSlice.reducer;
