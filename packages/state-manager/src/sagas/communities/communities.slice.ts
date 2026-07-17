import { createSlice, type EntityState, type PayloadAction } from '@reduxjs/toolkit'
import { StoreKeys } from '../store.keys'
import { communitiesAdapter } from './communities.adapter'
import {
  CreateCommunityPayload,
  DebugAddServerPayload,
  InvitationData,
  JoinCommunityPayload,
  LaunchCommunityPayload,
  ServerAddedPayload,
  UpdateCommunityPayload,
  type Community,
} from '@quiet/types'
import { createLogger } from '../../utils/logger'

const logger = createLogger('communitiesSlice')

export class CommunitiesState {
  public invitationCodes: InvitationData | null = null
  public currentCommunity = ''
  public communities: EntityState<Community> = communitiesAdapter.getInitialState()
  public connectionInProgress = false
  public tosRequested = false
  public captchaRequested = false
}

export const communitiesSlice = createSlice({
  initialState: { ...new CommunitiesState() },
  name: StoreKeys.Communities,
  reducers: {
    setConnectionInProgress: (state, action: PayloadAction<boolean>) => {
      state.connectionInProgress = action.payload
    },
    setCurrentCommunity: (state, action: PayloadAction<string>) => {
      logger.info('Setting current community', JSON.stringify(action.payload, null, 2))
      state.currentCommunity = action.payload
    },
    addNewCommunity: (state, action: PayloadAction<Community>) => {
      logger.info('Adding new community', JSON.stringify(action.payload, null, 2))
      communitiesAdapter.addOne(state.communities, action.payload)
    },
    updateCommunityData: (state, action: PayloadAction<UpdateCommunityPayload>) => {
      logger.info('Updating community data', JSON.stringify(action.payload, null, 2))
      communitiesAdapter.updateOne(state.communities, {
        id: action.payload.id,
        changes: {
          ...action.payload.updates,
        },
      })
    },
    deleteCommunity: (state, action: PayloadAction<string>) => {
      communitiesAdapter.removeOne(state.communities, action.payload)
      if (state.currentCommunity === action.payload) {
        state.currentCommunity = ''
      }
    },
    resetApp: (state, _action) => state,
    createCommunity: (state, _action: PayloadAction<CreateCommunityPayload>) => state,
    joinCommunity: (state, _action: PayloadAction<JoinCommunityPayload>) => state,
    launchCommunity: (state, _action: PayloadAction<LaunchCommunityPayload>) => state,
    addServer: (state, _action: PayloadAction<ServerAddedPayload>) => state,
    debugAddServer: (state, _action: PayloadAction<DebugAddServerPayload>) => state,
    acceptServer: state => state,
    customProtocol: (state, _action: PayloadAction<string[]>) => state,
    setInvitationCodes: (state, action: PayloadAction<InvitationData>) => {
      state.invitationCodes = action.payload
    },
    clearInvitationCodes: state => {
      state.invitationCodes = null
    },
    requestTermsOfService: state => {
      logger.info('Requesting terms of service acceptance')
      state.tosRequested = true
    },
    setTermsOfServiceAccepted: (state, action: PayloadAction<{ communityId?: string; accepted: boolean }>) => {
      state.tosRequested = false
      const { communityId, accepted } = action.payload
      if (communityId) {
        const community = state.communities.entities[communityId]
        if (community) {
          communitiesAdapter.updateOne(state.communities, {
            id: communityId,
            changes: {
              tosAccepted: accepted,
            },
          })
        }
      }
    },
  },
})

export const communitiesActions = communitiesSlice.actions
export const communitiesReducer = communitiesSlice.reducer
