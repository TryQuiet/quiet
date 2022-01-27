import { createSlice, EntityState, PayloadAction } from '@reduxjs/toolkit'
import { StoreKeys } from '../store.keys'
import { identityAdapter } from './identity.adapter'
import {
  CreateUserCsrPayload,
  Identity,
  StoreUserCertificatePayload,
  StoreUserCsrPayload,
  UpdateUsernamePayload
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
    saveOwnerCertToDb: (state, _action: PayloadAction<string>) => state,
    savedOwnerCertificate: (state, _action: PayloadAction<string>) => state,
    registerUsername: (state, _action: PayloadAction<string>) => state,
    updateUsername: (state, action: PayloadAction<UpdateUsernamePayload>) => {
      identityAdapter.updateOne(state.identities, {
        id: action.payload.communityId,
        changes: {
          nickname: action.payload.nickname
        }
      })
    },
    storeUserCsr: (state, action: PayloadAction<StoreUserCsrPayload>) => {
      identityAdapter.updateOne(state.identities, {
        id: action.payload.communityId,
        changes: {
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
        changes: { userCertificate: action.payload.userCertificate }
      })
    },
    throwIdentityError: (state, _action: PayloadAction<string>) => state
  }
})

export const identityActions = identitySlice.actions
export const identityReducer = identitySlice.reducer
