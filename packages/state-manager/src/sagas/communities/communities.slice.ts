import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { StoreKeys } from '../store.keys'
import {
  InvitationPair,
  type AddOwnerCertificatePayload,
  type Community,
  type CreateNetworkPayload,
  type ResponseCreateNetworkPayload,
  type StorePeerListPayload,
  type UpdateCommunityPayload,
  type UpdateRegistrationAttemptsPayload,
  CommunityMetadataPayload,
  InvitationData,
} from '@quiet/types'

export class CommunitiesState {
  public psk: string | undefined
  public invitationCodes: InvitationPair[] = []
  public community: Community = {
    id: ''
  }
}

export const communitiesSlice = createSlice({
  initialState: { ...new CommunitiesState() },
  name: StoreKeys.Communities,
  reducers: {
    storeCommunity: (state, action: PayloadAction<Community>) => {
      state.community = action.payload
    },

    updateCommunity: (state, _action: PayloadAction<UpdateCommunityPayload>) => state, // QUESTION: What's the dfference btween those two?
    updateCommunityData: (state, action: PayloadAction<Community>) => {
      state.community = action.payload
    },

    createNetwork: (state, _action: PayloadAction<CreateNetworkPayload>) => state,
    responseCreateNetwork: (state, _action: PayloadAction<ResponseCreateNetworkPayload>) => state,

    storePeerList: (state, action: PayloadAction<StorePeerListPayload>) => {
      state.community = {
        ...state.community,
        peerList: action.payload.peerList
      }
    },

    resetApp: (state, _action) => state,
    
    launchCommunity: (state, _action: PayloadAction<string | undefined>) => state,
    launchRegistrar: (state, _action: PayloadAction<string | undefined>) => state,
    
    updateRegistrationAttempts: (state, action: PayloadAction<UpdateRegistrationAttemptsPayload>) => {
      state.community = {
        ...state.community,
        registrationAttempts: action.payload.registrationAttempts
      }
    },
    
    customProtocol: (state, _action: PayloadAction<InvitationData>) => state,
    
    setInvitationCodes: (state, action: PayloadAction<InvitationPair[]>) => {
      state.invitationCodes = action.payload
    },
    clearInvitationCodes: state => {
      state.invitationCodes = []
    },
    
    addOwnerCertificate: (state, action: PayloadAction<AddOwnerCertificatePayload>) => {
      state.community = {
        ...state.community,
        ownerCertificate: action.payload.ownerCertificate
      }
    },
    
    sendCommunityMetadata: state => state,
    saveCommunityMetadata: (state, _action: PayloadAction<CommunityMetadataPayload>) => state,
    
    savePSK: (state, action: PayloadAction<string>) => {
      state.psk = action.payload
    },
  },
})

export const communitiesActions = communitiesSlice.actions
export const communitiesReducer = communitiesSlice.reducer
