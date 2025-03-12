import { createSlice, type EntityState, type PayloadAction } from '@reduxjs/toolkit'
import { DateTime } from 'luxon'
import { StoreKeys } from '../store.keys'
import { identityAdapter } from './identity.adapter'
import { type UpdateJoinTimestampPayload, type Identity, type RegisterUsernamePayload } from '@quiet/types'
import { createLogger } from '../../utils/logger'

const logger = createLogger('identity:slice')

export class IdentityState {
  public identities: EntityState<Identity> = identityAdapter.getInitialState()
}

export const identitySlice = createSlice({
  initialState: { ...new IdentityState() },
  name: StoreKeys.Identity,
  reducers: {
    addNewIdentity: (state, action: PayloadAction<Identity>) => {
      identityAdapter.addOne(state.identities, action.payload)
    },
    updateIdentity: (state, action: PayloadAction<Identity>) => {
      // addOne if action.payload.id is not in state.identities
      if (!state.identities.ids.includes(action.payload.id)) {
        logger.info('Adding new identity', action.payload.id, action.payload.nickname)
        identityAdapter.addOne(state.identities, action.payload)
      } else {
        logger.info('Updating existing identity', action.payload.id, action.payload.nickname)
        identityAdapter.updateOne(state.identities, {
          id: action.payload.id,
          changes: action.payload,
        })
      }
    },
    registerUsername: (state, _action: PayloadAction<RegisterUsernamePayload>) => state,
    verifyJoinTimestamp: state => state,
    updateJoinTimestamp: (state, action: PayloadAction<UpdateJoinTimestampPayload>) => {
      identityAdapter.updateOne(state.identities, {
        id: action.payload.communityId,
        changes: {
          joinTimestamp: DateTime.utc().valueOf(),
        },
      })
    },
  },
})

export const identityActions = identitySlice.actions
export const identityReducer = identitySlice.reducer
