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
    createCommunity: (state, _action: PayloadAction<string>) => state,
    launchCommunity: (state, _action: PayloadAction<string>) => state,
    customProtocol: (state, _action: PayloadAction<InvitationData>) => state,
    setInvitationCodes: (state, action: PayloadAction<InvitationPair[]>) => {
      state.invitationCodes = action.payload
    },
    clearInvitationCodes: state => {
      state.invitationCodes = []
    },
    saveCommunityMetadata: (state, _action: PayloadAction<CommunityMetadata>) => state,
    /**
     * Migrate data in this store. This is necessary because we persist the
     * Redux data to disk (it's not reset on each app start). This function is
     * meant to be called once the store has been rehydrated from storage.
     */
    migrate: state => {
      // MIGRATION: Move CommunitiesState.psk to Community.psk

      // Removing psk from the CommunitiesState class causes type errors. Below
      // is one solution. Another alternative is making CommunitiesState a union
      // type, e.g. CommunitiesStateV1 | CommunitiesStateV2, or simply leaving
      // the psk field in CommunitiesState and marking it deprecated in a
      // comment.
      const prevState = state as CommunitiesState & { psk?: string | undefined }

      if (prevState.psk) {
        communitiesAdapter.updateOne(prevState.communities, {
          // At this time we only have a single community
          id: prevState.currentCommunity,
          changes: {
            psk: prevState.psk,
          },
        })
      }
      delete prevState.psk
    },
  },
})

export const communitiesActions = communitiesSlice.actions
export const communitiesReducer = communitiesSlice.reducer
