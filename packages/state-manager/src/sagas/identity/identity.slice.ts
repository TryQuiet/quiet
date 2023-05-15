import { createSlice, EntityState, PayloadAction } from '@reduxjs/toolkit'
import { DateTime } from 'luxon'
import { StoreKeys } from '../store.keys'
import { identityAdapter } from './identity.adapter'
import {
  CreateUserCsrPayload,
  Identity,
  RegisterCertificatePayload,
  StoreUserCertificatePayload
} from './identity.types'

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
    createUserCsr: (state, _action: PayloadAction<CreateUserCsrPayload>) =>
      state,
    saveOwnerCertToDb: state => state,
    savedOwnerCertificate: (state, _action: PayloadAction<string>) => state,
    registerUsername: (state, _action: PayloadAction<string>) => state,
    registerCertificate: (state, action: PayloadAction<RegisterCertificatePayload>) => {
      identityAdapter.updateOne(state.identities, {
        id: action.payload.communityId,
        changes: {
          nickname: action.payload.nickname,
          userCsr: action.payload.userCsr
        }
      })
    },
    storeUserCertificate: (
      state,
      action: PayloadAction<StoreUserCertificatePayload>
    ) => {
      identityAdapter.updateOne(state.identities, {
        id: action.payload.communityId,
        changes: {
          userCertificate: action.payload.userCertificate,
          joinTimestamp: DateTime.utc().valueOf()
        }
      })
    },
    throwIdentityError: (state, _action: PayloadAction<string>) => state
  }
})

export const identityActions = identitySlice.actions
export const identityReducer = identitySlice.reducer
