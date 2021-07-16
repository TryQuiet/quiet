import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { ActionsType } from '../../sagas/const/actionsTypes'

export class CertificatesState {
  usersCertificates: string[] = ['']
  ownCertificate = {
    certificate: '',
    privateKey: ''
  }

  registrationError: string = null
}

export const certificates = createSlice({
  initialState: { ...new CertificatesState() },
  name: 'Certificates',
  reducers: {
    setUsersCertificates: (state, action: PayloadAction<string[]>) => {
      state.usersCertificates = action.payload
    },
    setOwnCertificate: (state, action: PayloadAction<string>) => {
      state.ownCertificate.certificate = action.payload
    },
    setOwnCertKey: (state, action: PayloadAction<string>) => {
      state.ownCertificate.privateKey = action.payload
    },
    setRegistrationError: (state, action: PayloadAction<string>) => {
      state.registrationError = action.payload
      state.ownCertificate.certificate = ''
      state.ownCertificate.privateKey = ''
    },
    createOwnCertificate: (state, _action: PayloadAction<string>) => {
      return state
    },
    registerUserCertificate: (state, _action: PayloadAction<{serviceAddress: string; userCsr: string}>) => {
      state.registrationError = null
      state.ownCertificate.certificate = ''
      state.ownCertificate.privateKey = ''
      return state
    },
    saveCertificate: (state, _action: PayloadAction<string>) => {
      return state
    },
    responseGetCertificates: (state, _action: PayloadAction<{ certificates: string[] }>) => {
      return state
    },
    responseGetCertificate: (state, _action: PayloadAction<string>) => {
      return state
    }
  }
})
export type CertificatesActions = ActionsType<typeof certificates.actions>

export const certificatesActions = certificates.actions
export const certificatesReducer = certificates.reducer
