import { createSlice, type EntityState, type PayloadAction } from '@reduxjs/toolkit'
import { StoreKeys } from '../store.keys'
import { communitiesAdapter } from './communities.adapter'
import {
  InvitationPair,
  type AddOwnerCertificatePayload,
  type Community as CommunityType,
  type CreateNetworkPayload,
  type ResponseCreateNetworkPayload,
  type ResponseRegistrarPayload,
  type StorePeerListPayload,
  type UpdateRegistrationAttemptsPayload,
  CommunityMetadata,
  InvitationData,
} from '@quiet/types'

export class CommunitiesState {
  public invitationCodes: InvitationPair[] = []
  public currentCommunity = ''
  public communities: EntityState<CommunityType> = communitiesAdapter.getInitialState()
  public psk: string | undefined
}

export const communitiesSlice = createSlice({
  initialState: { ...new CommunitiesState() },
  name: StoreKeys.Communities,
  reducers: {
    setCurrentCommunity: (state, action: PayloadAction<string>) => {
      state.currentCommunity = action.payload
    },
    addNewCommunity: (state, action: PayloadAction<CommunityType>) => {
      communitiesAdapter.addOne(state.communities, action.payload)
    },
    updateCommunity: (state, _action: PayloadAction<CommunityType>) => state,
    updateCommunityData: (state, action: PayloadAction<CommunityType>) => {
      communitiesAdapter.updateOne(state.communities, {
        id: action.payload.id,
        changes: {
          ...action.payload,
        },
      })
    },
    sendCommunityMetadata: state => state,
    createNetwork: (state, _action: PayloadAction<CreateNetworkPayload>) => state,
    responseCreateNetwork: (state, _action: PayloadAction<ResponseCreateNetworkPayload>) => state,
    responseRegistrar: (state, action: PayloadAction<ResponseRegistrarPayload>) => {
      communitiesAdapter.updateOne(state.communities, {
        id: action.payload.id,
        changes: {
          ...action.payload.payload,
        },
      })
    },
    storePeerList: (state, action: PayloadAction<StorePeerListPayload>) => {
      communitiesAdapter.updateOne(state.communities, {
        id: action.payload.communityId,
        changes: {
          ...action.payload,
        },
      })
    },
    resetApp: (state, _action) => state,
    launchCommunity: (state, _action: PayloadAction<string | undefined>) => state,
    launchRegistrar: (state, _action: PayloadAction<string | undefined>) => state,
    updateRegistrationAttempts: (state, action: PayloadAction<UpdateRegistrationAttemptsPayload>) => {
      communitiesAdapter.updateOne(state.communities, {
        id: action.payload.id,
        changes: {
          ...action.payload,
        },
      })
    },
    customProtocol: (state, _action: PayloadAction<InvitationData>) => state,
    setInvitationCodes: (state, action: PayloadAction<InvitationPair[]>) => {
      state.invitationCodes = action.payload
    },
    clearInvitationCodes: state => {
      state.invitationCodes = []
    },
    addOwnerCertificate: (state, action: PayloadAction<AddOwnerCertificatePayload>) => {
      const { communityId, ownerCertificate } = action.payload
      communitiesAdapter.updateOne(state.communities, {
        id: communityId,
        changes: {
          ownerCertificate,
        },
      })
    },
    saveCommunityMetadata: (state, _action: PayloadAction<CommunityMetadata>) => state,
    savePSK: (state, action: PayloadAction<string>) => {
      state.psk = action.payload
    },
  },
})

export const communitiesActions = communitiesSlice.actions
export const communitiesReducer = communitiesSlice.reducer
