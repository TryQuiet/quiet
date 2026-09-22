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
  AdmissionResetCompletePayload,
  type Community,
} from '@quiet/types'
import { createLogger } from '../../utils/logger'
import { identityActions } from '../identity/identity.slice'
import type { AdmissionResetStatus, JoinCommunityError } from './communities.types'

const logger = createLogger('communitiesSlice')

export interface PendingCommunityJoin {
  attempt: number
  communityId?: string
  inviteData: InvitationData
  username?: string
  tosAccepted?: boolean
  status: 'draft' | 'submitting' | 'interrupted'
}

export interface PendingCommunityCreate {
  name: string
  useServer: boolean
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
  public admissionResetStatus: AdmissionResetStatus = 'idle'
  public admissionResetResult: JoinCommunityError | null = null
  public joinCommunityError: JoinCommunityError | null = null
  /**
   * The community the owner is creating, kept from the moment they submit until
   * the backend hands back a record. The progress screen is up for all of that
   * and has nothing else to read: without this it would head itself "Joining
   * community" with no name, because ownership and name only exist on the
   * record.
   */
  public pendingCreate: PendingCommunityCreate | null = null
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
      // The record carries the name, the ownership and qssEnabled from here on,
      // so the remembered create is spent.
      state.pendingCreate = null
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
    resetAdmission: (state, _action: PayloadAction<string>) => state,
    admissionResetCompleted: (state, _action: PayloadAction<AdmissionResetCompletePayload>) => state,
    setAdmissionResetStatus: (state, action: PayloadAction<AdmissionResetStatus>) => {
      state.admissionResetStatus = action.payload
    },
    setAdmissionResetResult: (state, action: PayloadAction<JoinCommunityError | null>) => {
      state.admissionResetResult = action.payload
    },
    finalizeAdmissionReset: (state, action: PayloadAction<JoinCommunityError>) => {
      state.admissionResetStatus = 'finalizing'
      state.admissionResetResult = null
      state.joinCommunityError = action.payload
    },
    setJoinCommunityError: (state, action: PayloadAction<JoinCommunityError>) => {
      state.joinCommunityError = action.payload
    },
    clearJoinCommunityError: state => {
      state.joinCommunityError = null
    },
    createCommunity: (state, action: PayloadAction<CreateCommunityPayload>) => {
      if (state.pendingJoin?.status === 'draft') {
        state.pendingJoin = null
        state.invitationCodes = null
      }
      state.pendingCreate = { name: action.payload.name, useServer: action.payload.useServer === true }
    },
    cancelCommunityOnboarding: state => state,
    joinCommunity: (state, action: PayloadAction<JoinCommunityPayload>) => {
      // A submitted request may have reached the backend, whose join operation
      // erases previous state. Never replay it merely because the socket reconnects.
      if (state.pendingJoin && state.pendingJoin.status !== 'draft') return
      state.joinAttempt = (state.joinAttempt ?? 0) + 1
      state.pendingCreate = null
      state.pendingJoin = {
        attempt: state.joinAttempt,
        inviteData: action.payload.inviteData,
        status: 'draft',
      }
      state.invitationCodes = action.payload.inviteData
    },
    linkDevice: (state, _action: PayloadAction<LinkDevicePayload>) => state,
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
      state.pendingCreate = null
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
