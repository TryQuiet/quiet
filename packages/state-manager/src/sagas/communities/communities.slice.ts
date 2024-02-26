import { createSlice, type EntityState, type PayloadAction } from '@reduxjs/toolkit'
import { StoreKeys } from '../store.keys'
import { communitiesAdapter } from './communities.adapter'
import {
  InvitationPair,
  type AddOwnerCertificatePayload,
  type Community,
  type CreateNetworkPayload,
  type StorePeerListPayload,
  CommunityMetadata,
  InvitationData,
} from '@quiet/types'

export class CommunitiesState {
  public invitationCodes: InvitationPair[] = []
  public currentCommunity = ''
  public communities: EntityState<Community> = communitiesAdapter.getInitialState()
  public psk: string | undefined
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
    updateCommunity: (state, _action: PayloadAction<Community>) => state,
    updateCommunityData: (state, action: PayloadAction<Community>) => {
      communitiesAdapter.updateOne(state.communities, {
        id: action.payload.id,
        changes: {
          ...action.payload,
        },
      })
    },
    sendCommunityCaData: state => state,
    sendCommunityMetadata: state => state,
    createNetwork: (state, _action: PayloadAction<CreateNetworkPayload>) => state,
    storePeerList: (state, action: PayloadAction<StorePeerListPayload>) => {
      communitiesAdapter.updateOne(state.communities, {
        id: action.payload.communityId,
        changes: {
          ...action.payload,
        },
      })
    },
    resetApp: (state, _action) => state,
    launchCommunity: (state, _action: PayloadAction<string>) => state,
    customProtocol: (state, _action: PayloadAction<InvitationData>) => state,
    setInvitationCodes: (state, action: PayloadAction<InvitationPair[]>) => {
      state.invitationCodes = action.payload
    },
    clearInvitationCodes: state => {
      state.invitationCodes = []
    },
    saveCommunityMetadata: (state, _action: PayloadAction<CommunityMetadata>) => state,
    savePSK: (state, action: PayloadAction<string>) => {
      state.psk = action.payload
    },
  },
})

export const communitiesActions = communitiesSlice.actions
export const communitiesReducer = communitiesSlice.reducer
