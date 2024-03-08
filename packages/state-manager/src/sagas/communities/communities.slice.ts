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
    updateCommunityData: (state, action: PayloadAction<Community>) => {
      communitiesAdapter.updateOne(state.communities, {
        id: action.payload.id,
        changes: {
          ...action.payload,
        },
      })
    },
    sendCommunityCaData: state => state,
    createNetwork: (state, _action: PayloadAction<CreateNetworkPayload>) => state,
    resetApp: (state, _action) => state,
    createCommunity: (state, _action: PayloadAction<string>) => state,
    launchCommunity: (state, _action: PayloadAction<string>) => state,
    customProtocol: (state, _action: PayloadAction<InvitationData>) => state,
    setInvitationCodes: (state, action: PayloadAction<InvitationPair[]>) => {
      state.invitationCodes = action.payload
    },
    clearInvitationCodes: state => {
      state.invitationCodes = []
    },
  },
})

export const communitiesActions = communitiesSlice.actions
export const communitiesReducer = communitiesSlice.reducer
