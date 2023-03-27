import { createSlice, EntityState, PayloadAction } from '@reduxjs/toolkit'
import { StoreKeys } from '../store.keys'
import { communitiesAdapter } from './communities.adapter'
import {
  CreateNetworkPayload,
  ResponseCreateNetworkPayload,
  ResponseRegistrarPayload,
  StorePeerListPayload,
  UpdateCommunityPayload,
  UpdateRegistrationAttemptsPayload
} from './communities.types'

export class CommunitiesState {
  public currentCommunity: string = ''
  public invitationCode: string = ''

  public communities: EntityState<Community> = communitiesAdapter.getInitialState()
}

export interface Community {
  id: string
  name: string
  CA: null | {
    rootCertString: string
    rootKeyString: string
  }
  rootCa: string
  peerList: string[]
  registrarUrl: string
  registrar: null | {
    privateKey: string
    address: string
  }
  onionAddress: string
  privateKey: string
  port: number
  registrationAttempts: number
}

export const communitiesSlice = createSlice({
  initialState: { ...new CommunitiesState() },
  name: StoreKeys.Communities,
  reducers: {
    setCurrentCommunity: (state, action: PayloadAction<string>) => {
      state.currentCommunity = action.payload
    },
    addNewCommunity: (state, action: PayloadAction<Community>) => {
      communitiesAdapter.addOne(state.communities, action.payload)
    },
    updateCommunity: (state, _action: PayloadAction<UpdateCommunityPayload>) => state,
    updateCommunityData: (state, action: PayloadAction<Partial<Community>>) => {
      communitiesAdapter.updateOne(state.communities, {
        id: action.payload.id,
        changes: {
          ...action.payload
        }
      })
    },
    createNetwork: (state, _action: PayloadAction<CreateNetworkPayload>) => state,
    responseCreateNetwork: (
      state,
      _action: PayloadAction<ResponseCreateNetworkPayload>
    ) => state,
    responseRegistrar: (
      state,
      action: PayloadAction<ResponseRegistrarPayload>
    ) => {
      communitiesAdapter.updateOne(state.communities, {
        id: action.payload.id,
        changes: {
          ...action.payload.payload
        }
      })
    },
    storePeerList: (state, action: PayloadAction<StorePeerListPayload>) => {
      communitiesAdapter.updateOne(state.communities, {
        id: action.payload.communityId,
        changes: {
          ...action.payload
        }
      })
    },
    resetApp: (state, _action) => state,
    launchCommunity: (state, _action: PayloadAction<string>) => state,
    launchRegistrar: (state, _action: PayloadAction<string>) => state,
    updateRegistrationAttempts: (state, action: PayloadAction<UpdateRegistrationAttemptsPayload>) => {
      communitiesAdapter.updateOne(state.communities, {
        id: action.payload.id,
        changes: {
          ...action.payload
        }
      })
    },
    handleInvitationCode: (state, _action: PayloadAction<string>) => state,
    setInvitationCode: (state, action: PayloadAction<string>) => {
      state.invitationCode = action.payload
    },
  }
})

export const communitiesActions = communitiesSlice.actions
export const communitiesReducer = communitiesSlice.reducer
