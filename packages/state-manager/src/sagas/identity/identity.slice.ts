import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

import { StoreKeys } from '../store.keys'

import {
  type Identity,
  type StoreCsrPayload,
  type StoreCertificatePayload,
  type ChooseUsernamePayload,
} from '@quiet/types'

import { DateTime } from 'luxon'

export class IdentityState {
  public identity: Identity = {
    id: '',
    nickname: '',
    hiddenService: {
      onionAddress: '',
      privateKey: ''
    },
    peerId: {
      id: ''
    },
    userCsr: null,
    userCertificate: null,
    joinTimestamp: null
  }
}

export const identitySlice = createSlice({
  initialState: { ...new IdentityState() },
  name: StoreKeys.Identity,
  reducers: {
    // Adds an empty Identity object to the redux store
    storeIdentity: (state, action: PayloadAction<Identity>) => {
      state.identity = action.payload
    },
    
    saveOwnerCertToDb: (state) => state, // <== FIXME: Move to backend entirely
    
    // Triggers launching community (once)
    savedOwnerCertificate: (state) => state,

    // Creates/modifies user CSR
    chooseUsername: (state, action: PayloadAction<ChooseUsernamePayload>) => {
      const { nickname } = action.payload
      state.identity = {
        ...state.identity,
        nickname: nickname
      }
    },

    // Registers owners' certificate
    registerCertificate: (state) => state,

    // Stores user certificate to redux store
    storeUserCertificate: (state, action: PayloadAction<StoreCertificatePayload>) => {
      const { certificate } = action.payload
      state.identity = {
        ...state.identity,
        userCertificate: certificate,
        joinTimestamp: DateTime.utc().valueOf()
      }
    },

    /* TODO: 
     *
     * On community launch, look for the stored CSRs and check it against the local one (with the proper username)
     * If it doesn't match, send the local CSR to the backend to be stored in the DB.
     * If it matches, do nothing.
     */

    // Emits event to backend to save CSR to DB
    saveUserCsr: (state) => state,

    // Stores CSR to redux store
    storeUserCsr: (state, action: PayloadAction<StoreCsrPayload>) => {
      const { csr } = action.payload
      state.identity = {
        ...state.identity,
        userCsr: csr
      }
    },

    verifyJoinTimestamp: (state) => state,
    updateJoinTimestamp: (state) => {
      state.identity = {
        ...state.identity,
        joinTimestamp: DateTime.utc().valueOf()
      }
    },

    throwIdentityError: (state, _action: PayloadAction<string>) => state,
  },
})

export const identityActions = identitySlice.actions
export const identityReducer = identitySlice.reducer
