import { createSlice, type EntityState, type PayloadAction } from '@reduxjs/toolkit'
import { StoreKeys } from '../store.keys'
import { communitiesAdapter } from './communities.adapter'
import {
  CreateCommunityPayload,
  InvitationData,
  JoinCommunityPayload,
  LinkDevicePayload,
  LaunchCommunityPayload,
  UpdateCommunityPayload,
  type Community,
} from '@quiet/types'
import { createLogger } from '../../utils/logger'
import { identityActions } from '../identity/identity.slice'

const logger = createLogger('communitiesSlice')

export interface PendingCommunityJoin {
  attempt: number
  communityId?: string
  inviteData: InvitationData
  username?: string
  tosAccepted?: boolean
  status: 'draft' | 'submitting' | 'interrupted'
}

export class CommunitiesState {
  public invitationCodes: InvitationData | null = null
  public currentCommunity = ''
  public communities: EntityState<Community> = communitiesAdapter.getInitialState()
  public connectionInProgress = false
  public tosRequested = false
  public captchaRequested = false
  public joinAttempt = 0
  public pendingJoin: PendingCommunityJoin | null = null
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
      logger.info('Adding new community', action.payload.id)
      communitiesAdapter.addOne(state.communities, action.payload)
    },
    updateCommunityData: (state, action: PayloadAction<UpdateCommunityPayload>) => {
      logger.info('Updating community data', action.payload.id)
      communitiesAdapter.updateOne(state.communities, {
        id: action.payload.id,
        changes: {
          ...action.payload.updates,
        },
      })
    },
    deleteCommunity: (state, action: PayloadAction<string>) => {
      logger.info('Deleting community', JSON.stringify(action.payload, null, 2))
      communitiesAdapter.removeOne(state.communities, action.payload)
      if (state.currentCommunity === action.payload) {
        state.currentCommunity = ''
      }
    },
    resetApp: (state, _action) => state,
    createCommunity: (state, _action: PayloadAction<CreateCommunityPayload>) => {
      if (state.pendingJoin?.status === 'draft') {
        state.pendingJoin = null
        state.invitationCodes = null
      }
    },
    joinCommunity: (state, action: PayloadAction<JoinCommunityPayload>) => {
      // A submitted request may have reached the backend, whose join operation
      // erases previous state. Never replay it merely because the socket reconnects.
      if (state.pendingJoin && state.pendingJoin.status !== 'draft') return
      state.joinAttempt = (state.joinAttempt ?? 0) + 1
      state.pendingJoin = {
        attempt: state.joinAttempt,
        inviteData: action.payload.inviteData,
        status: 'draft',
      }
      state.invitationCodes = action.payload.inviteData
    },
    setPendingJoinId: (state, action: PayloadAction<{ attempt: number; communityId: string }>) => {
      if (state.pendingJoin?.attempt === action.payload.attempt) {
        state.pendingJoin.communityId = action.payload.communityId
      }
    },
    submitPendingJoin: (state, action: PayloadAction<number>) => {
      if (state.pendingJoin?.attempt === action.payload && state.pendingJoin.status === 'draft') {
        state.pendingJoin.status = 'submitting'
      }
    },
    interruptPendingJoin: (state, action: PayloadAction<number>) => {
      if (state.pendingJoin?.attempt === action.payload && state.pendingJoin.status === 'submitting') {
        state.pendingJoin.status = 'interrupted'
      }
    },
    linkDevice: (state, _action: PayloadAction<LinkDevicePayload>) => {
      if (state.pendingJoin?.status === 'draft') {
        state.pendingJoin = null
        state.invitationCodes = null
      }
    },
    launchCommunity: (state, _action: PayloadAction<LaunchCommunityPayload>) => state,
    customProtocol: (state, _action: PayloadAction<string[]>) => state,
    setInvitationCodes: (state, action: PayloadAction<InvitationData>) => {
      logger.info('Setting invitation codes')
      state.invitationCodes = action.payload
    },
    clearInvitationCodes: state => {
      logger.info('Clearing invitation codes')
      state.invitationCodes = null
      state.pendingJoin = null
      state.tosRequested = false
    },
    requestTermsOfService: state => {
      logger.info('Requesting terms of service acceptance')
      state.tosRequested = true
    },
    setTermsOfServiceAccepted: (state, action: PayloadAction<{ communityId?: string; accepted: boolean }>) => {
      state.tosRequested = false
      const { communityId, accepted } = action.payload
      if (!communityId && state.pendingJoin?.status === 'draft') {
        state.pendingJoin.tosAccepted = accepted
      }
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
  extraReducers: builder => {
    builder.addCase(identityActions.registerUsername, (state, action) => {
      // Reducers remain alive while socket-owned sagas are stopped. Keep form
      // submissions here so a reconnect can resume the same draft without replaying
      // transient username/terms actions into a listener that no longer exists.
      if (state.pendingJoin?.status === 'draft') {
        state.pendingJoin.username = action.payload.nickname
      }
    })
  },
})

export const communitiesActions = communitiesSlice.actions
export const communitiesReducer = communitiesSlice.reducer
