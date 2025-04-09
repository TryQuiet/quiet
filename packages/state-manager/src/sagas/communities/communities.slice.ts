import { createSlice, type EntityState, type PayloadAction } from '@reduxjs/toolkit'
import { StoreKeys } from '../store.keys'
import { communitiesAdapter } from './communities.adapter'
import {
  CreateCommunityPayload,
  InvitationData,
  JoinCommunityPayload,
  LaunchCommunityPayload,
  type Community,
} from '@quiet/types'
import { createLogger } from '../../utils/logger'

const logger = createLogger('communitiesSlice')

export class CommunitiesState {
  public invitationCodes: Record<string, InvitationData> = {}
  public currentCommunity = ''
  public communities: EntityState<Community> = communitiesAdapter.getInitialState()
}

export const communitiesSlice = createSlice({
  initialState: { ...new CommunitiesState() },
  name: StoreKeys.Communities,
  reducers: {
    setCurrentCommunity: (state, action: PayloadAction<string>) => {
      logger.info('Setting current community', action.payload)
      state.currentCommunity = action.payload
    },
    addNewCommunity: (state, action: PayloadAction<Community>) => {
      logger.info('Adding new community', action.payload)
      communitiesAdapter.addOne(state.communities, action.payload)
    },
    updateCommunityData: (state, action: PayloadAction<Community>) => {
      logger.info('Updating community data', action.payload)
      communitiesAdapter.updateOne(state.communities, {
        id: action.payload.id,
        changes: {
          ...action.payload,
        },
      })
    },
    deleteCommunity: (state, action: PayloadAction<string>) => {
      logger.info('Deleting community', action.payload)
      communitiesAdapter.removeOne(state.communities, action.payload)
      if (state.currentCommunity === action.payload) {
        state.currentCommunity = ''
      }
    },
    resetApp: (state, _action) => state,
    createCommunity: (state, _action: PayloadAction<CreateCommunityPayload>) => state,
    joinCommunity: (state, _action: PayloadAction<JoinCommunityPayload>) => state,
    launchCommunity: (state, _action: PayloadAction<LaunchCommunityPayload>) => state,
    customProtocol: (state, _action: PayloadAction<string[]>) => state,
    setInvitationCodes: (state, action: PayloadAction<InvitationData>) => {
      logger.info('Setting invitation codes', action.payload)
      state.invitationCodes[action.payload.psk] = action.payload
    },
    clearInvitationCodes: state => {
      logger.info('Clearing invitation codes')
      state.invitationCodes = {}
    },
  },
})

export const communitiesActions = communitiesSlice.actions
export const communitiesReducer = communitiesSlice.reducer
