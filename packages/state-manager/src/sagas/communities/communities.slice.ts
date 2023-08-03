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
  type UpdateCommunityPayload,
  type UpdateRegistrationAttemptsPayload,
} from '@quiet/types'

export class CommunitiesState {
  public invitationCode: string | undefined = undefined
  public invitationCodes: InvitationPair[] = []
  public currentCommunity = ''
  public communities: EntityState<CommunityType> = communitiesAdapter.getInitialState()
}

// TODO: remove after setting strict in 'desktop' and 'mobile' packages
export interface Community {
  // TODO: how to set default values for Community?
  id: string
  name?: string
  CA?: null | {
    rootCertString: string
    rootKeyString: string
  }
  rootCa?: string
  peerList?: string[]
  registrarUrl?: string
  registrar?: null | {
    privateKey: string
    address: string
  }
  onionAddress?: string
  privateKey?: string
  port?: number
  registrationAttempts?: number
  ownerCertificate?: string
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
    updateCommunity: (state, _action: PayloadAction<UpdateCommunityPayload>) => state,
    updateCommunityData: (state, action: PayloadAction<CommunityType>) => {
      communitiesAdapter.updateOne(state.communities, {
        id: action.payload.id,
        changes: {
          ...action.payload,
        },
      })
    },
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
    handleInvitationCode: (state, action: PayloadAction<string>) => {
      state.invitationCode = action.payload
    },
    clearInvitationCode: state => {
      state.invitationCode = ''
    },
    handleInvitationCodes: (state, action: PayloadAction<InvitationPair[]>) => {
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
  },
})

export const communitiesActions = communitiesSlice.actions
export const communitiesReducer = communitiesSlice.reducer
